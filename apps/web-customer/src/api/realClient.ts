import type {
  LocationPreset, Category, ShopSummary, ShopDetail, InventoryEntry, GeoPoint, Product, Offer,
  GetShopsNearbyRequest, SearchProductsRequest, ProductSearchGroup, ShopOffer,
  GetProductDetailRequest, GetShopInventoryRequest, MatchedItem, ShopCoverage,
  MultiItemSearchRequest, MultiItemSearchResponse, RequestOtpRequest, VerifyOtpRequest,
  VerifyOtpResponse, AuthUser, CompleteProfileRequest, CompleteProfileResponse, Address,
  ShopType, UnitType, Availability, AvailabilitySource, Badge,
} from '@shopnear/shared'
import type { ShopNearApi, ProductDetailResponse } from './client'
import { mockClient } from './mockClient'
import { LOCATION_PRESETS } from './fixtures/location'
import { CATEGORIES, CATEGORY_BY_SLUG } from './fixtures/categories'

/**
 * The real backend client. Implements the catalogue/search/auth surface of
 * `ShopNearApi` against the live API (see `.superpowers/sdd/phase-2-tasks-*
 * -report.md` for the endpoint contracts this was written against).
 *
 * Ordering/checkout endpoints don't exist on the API yet (another agent is
 * building them) — those seven methods are re-exported straight from
 * `mockClient` at the bottom of this file so cart/checkout/orders keep
 * working today. Swapping them to the real thing later means replacing
 * exactly those seven lines.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

// ---------------------------------------------------------------------------
// Small pure helpers (deliberately not shared with mockClient's fixtures —
// this file must work with zero dependency on the mock's fixture data other
// than the two static, non-API-backed lookups below).
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// ---------------------------------------------------------------------------
// Auth token storage — access token attached to every request; refreshed
// transparently on a 401 (rotation: a fresh pair every refresh call).
// ---------------------------------------------------------------------------

const ACCESS_KEY = 'shopnear.accessToken.v1'
const REFRESH_KEY = 'shopnear.refreshToken.v1'
const USER_KEY = 'shopnear.user.v1'

function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
}
function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
}
function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch { /* private-browsing edge case — session just won't persist a reload */ }
}
function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}
function setStoredUser(user: AuthUser) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Fetch wrapper — every failure the API returns is `{ error: { code,
// message, details? } }` (spec §13); this surfaces as a real `ApiError`
// with a human `.message` so every existing `e instanceof Error ? e.message
// : ...` call site in the app already renders it sensibly, with zero
// changes needed there.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly code: string
  readonly details?: unknown
  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

let refreshPromise: Promise<void> | null = null

async function doRefresh(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new ApiError('UNAUTHORIZED', 'Your session has expired. Please log in again.')
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach ShopNear to refresh your session.')
  }
  if (!res.ok) {
    clearTokens()
    throw new ApiError('UNAUTHORIZED', 'Your session has expired. Please log in again.')
  }
  setTokens(await res.json())
}

async function apiFetch<T>(path: string, init: RequestInit = {}, allowRetry = true): Promise<T> {
  const accessToken = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach ShopNear. Check your connection, or that the API server is running on ' + BASE_URL + '.',
    )
  }

  if (res.status === 401 && accessToken && allowRetry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
    await refreshPromise
    return apiFetch<T>(path, init, false)
  }

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; details?: unknown } } | null = null
    try { body = await res.json() } catch { /* non-JSON error body */ }
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? `Something went wrong (HTTP ${res.status}). Please try again.`,
      body?.error?.details,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) usp.set(k, String(v))
  return usp.toString()
}

// ---------------------------------------------------------------------------
// Raw API row shapes (only the fields this client actually reads).
// ---------------------------------------------------------------------------

interface RawShopRow {
  id: string; name: string; nameGu: string; type: ShopType; description: string | null
  phone: string; address: string; lat: number; lng: number
  openingHours: unknown; acceptsDelivery: boolean; deliveryRadiusMeters: number
  minOrderValue: number; deliveryFee: number; avgRating: number; ratingCount: number
  bannerImageUrl: string | null; distanceMeters?: number; isOpenNow: boolean
}
interface RawProductRow {
  id: string; name: string; nameGu: string; brand: string | null; categoryId: string
  unitType: UnitType; defaultUnitLabel: string; mrp: number | null; imageUrl: string | null
  searchKeywords: string[]; isLooseGood: boolean
}
interface RawInventoryItem {
  id: string; shopId: string; productId: string; price: number
  availability: Availability; availabilityUpdatedAt: string; availabilitySource: AvailabilitySource
  product: RawProductRow
}
interface RawSearchResultRow {
  shopId: string; shopName: string; distanceMeters: number; isOpenNow: boolean
  product: { id: string; name: string; nameGu: string; imageUrl: string | null; unitType: UnitType; defaultUnitLabel: string }
  price: number; badge: Badge; score: number
}
interface RawMultiSearchShopRef { id: string; name: string; distanceMeters: number }
interface RawMultiSearchResponse {
  bestShop: { shop: RawMultiSearchShopRef | null; covered: string[]; missing: string[] }
  split: Array<{ shop: RawMultiSearchShopRef; covered: string[] }>
}

function toShopSummary(row: RawShopRow): ShopSummary {
  return {
    id: row.id, name: row.name, nameGu: row.nameGu, type: row.type,
    distanceMeters: Math.round(row.distanceMeters ?? 0), address: row.address, lat: row.lat, lng: row.lng,
    avgRating: row.avgRating, ratingCount: row.ratingCount, isOpenNow: row.isOpenNow,
    acceptsDelivery: row.acceptsDelivery, deliveryFee: row.deliveryFee, minOrderValue: row.minOrderValue,
    bannerImageUrl: row.bannerImageUrl,
  }
}
function toProduct(p: RawProductRow): Product {
  return {
    id: p.id, name: p.name, nameGu: p.nameGu, brand: p.brand, categoryId: p.categoryId,
    unitType: p.unitType, defaultUnitLabel: p.defaultUnitLabel, mrp: p.mrp, imageUrl: p.imageUrl,
    isLooseGood: p.isLooseGood,
    // categorySlug intentionally omitted — the API never joins to Category here.
  }
}
function toOffer(item: RawInventoryItem): Offer {
  return {
    shopId: item.shopId, price: item.price, availability: item.availability,
    availabilityUpdatedAt: item.availabilityUpdatedAt, availabilitySource: item.availabilitySource,
  }
}

/** Fetches a shop's *entire* inventory, transparently paginating past the
 * API's 100-item-per-page cap (`GET /api/shops/:id/inventory`) — callers
 * here always want the full list, never a page. */
async function fetchAllInventory(shopId: string, query?: string): Promise<RawInventoryItem[]> {
  const pageSize = 100
  let page = 1
  const all: RawInventoryItem[] = []
  for (;;) {
    const res = await apiFetch<{ items: RawInventoryItem[]; total: number }>(
      `/api/shops/${shopId}/inventory?${qs({ query, page, pageSize })}`,
    )
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0 || page > 10) break
    page += 1
  }
  return all
}

/** Best-effort local match of a free-text shopping-list term ("doodh",
 * "atta") against one shop's already-fetched inventory — used to enrich
 * `POST /api/search/multi`'s minimal coverage response (which carries no
 * price/product detail) back into the full per-item breakdown the UI
 * shows. Mirrors the two signals the API's own matcher uses server-side
 * (exact keyword, then substring on the name) without needing pg_trgm. */
function findInventoryMatch(items: RawInventoryItem[], term: string): RawInventoryItem | undefined {
  const q = term.trim().toLowerCase()
  if (!q) return undefined
  return (
    items.find((it) => it.product.searchKeywords?.some((k) => k.toLowerCase() === q)) ??
    items.find((it) => it.product.name.toLowerCase() === q) ??
    items.find((it) => it.product.name.toLowerCase().includes(q)) ??
    items.find((it) => it.product.searchKeywords?.some((k) => k.toLowerCase().includes(q)))
  )
}

async function buildCoverage(
  shopId: string, shop: ShopSummary, coveredTexts: string[], allTexts: string[],
): Promise<ShopCoverage> {
  const items = await fetchAllInventory(shopId)
  const itemsCovered: ShopCoverage['itemsCovered'] = []
  const itemsMissing: string[] = []
  let estimatedTotal = 0
  for (const text of allTexts) {
    const match = coveredTexts.includes(text) ? findInventoryMatch(items, text) : undefined
    if (!match) { itemsMissing.push(text); continue }
    itemsCovered.push({ queryText: text, offer: toOffer(match), product: toProduct(match.product) })
    estimatedTotal += match.price
  }
  const totalCount = allTexts.length
  const coveredCount = itemsCovered.length
  return {
    shop, itemsCovered, itemsMissing, coveredCount, totalCount,
    coveragePercent: totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100),
    estimatedTotal,
  }
}

// ---------------------------------------------------------------------------

const catalogueAndSearchClient: Pick<
  ShopNearApi,
  'getLocationPresets' | 'getCategories' | 'getShopsNearby' | 'getShop' | 'getShopInventory' |
  'searchProducts' | 'getProductDetail' | 'multiItemSearch' |
  'requestOtp' | 'verifyOtp' | 'completeProfile' | 'getCurrentUser' | 'logout'
> = {
  // Location presets and the category tree have no corresponding endpoint
  // on the real API (they're not per-user data, just curated demo
  // anchors / the seeded category tree) — both are static fixtures that
  // mirror the real seed exactly, shared with the mock.
  async getLocationPresets() {
    return LOCATION_PRESETS
  },

  async getCategories() {
    return CATEGORIES
  },

  async getShopsNearby(req: GetShopsNearbyRequest) {
    const res = await apiFetch<{ shops: RawShopRow[] }>(
      `/api/shops/nearby?${qs({ lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters, type: req.type })}`,
    )
    return res.shops.map(toShopSummary)
  },

  async getShop(shopId: string, location: GeoPoint): Promise<ShopDetail> {
    const res = await apiFetch<{ shop: RawShopRow; inventorySummary: ShopDetail['inventorySummary'] }>(
      `/api/shops/${shopId}`,
    )
    const shop = res.shop
    const distanceMeters = Math.round(haversineMetres(location.lat, location.lng, shop.lat, shop.lng))
    return {
      ...toShopSummary({ ...shop, distanceMeters }),
      description: shop.description,
      phone: shop.phone,
      openingHours: shop.openingHours as ShopDetail['openingHours'],
      inventorySummary: res.inventorySummary,
    }
  },

  async getShopInventory(req: GetShopInventoryRequest): Promise<InventoryEntry[]> {
    const items = await fetchAllInventory(req.shopId, req.query)
    let entries: InventoryEntry[] = items.map((item) => ({ product: toProduct(item.product), offer: toOffer(item) }))
    // categorySlug is never populated by the real API (no Category join) —
    // this filter is a no-op in practice since ShopPage only offers the
    // category chips when every product actually carries a slug.
    if (req.categorySlug) entries = entries.filter((e) => e.product.categorySlug === req.categorySlug)
    return entries.sort((a, b) => a.product.name.localeCompare(b.product.name))
  },

  async searchProducts(req: SearchProductsRequest): Promise<ProductSearchGroup[]> {
    const q = req.query?.trim() || (req.categorySlug ? CATEGORY_BY_SLUG.get(req.categorySlug)?.name : undefined)
    if (!q) return []

    const [nearbyRes, searchRes] = await Promise.all([
      apiFetch<{ shops: RawShopRow[] }>(
        `/api/shops/nearby?${qs({ lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters })}`,
      ),
      apiFetch<{ results: RawSearchResultRow[] }>(
        `/api/search?${qs({ q, lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters, pageSize: 100 })}`,
      ),
    ])
    const shopMap = new Map(nearbyRes.shops.map((row) => [row.id, toShopSummary(row)]))

    const groups = new Map<string, ProductSearchGroup>()
    for (const row of searchRes.results) {
      const shop: ShopSummary = shopMap.get(row.shopId) ?? {
        id: row.shopId, name: row.shopName, distanceMeters: row.distanceMeters, isOpenNow: row.isOpenNow,
      }
      const offer: ShopOffer = { shopId: row.shopId, price: row.price, badge: row.badge, shop }
      let group = groups.get(row.product.id)
      if (!group) {
        group = { product: { ...row.product }, offers: [] }
        groups.set(row.product.id, group)
      }
      group.offers.push(offer)
    }

    const result = Array.from(groups.values())
    // 'relevance' (the default) keeps the API's own score-descending order
    // exactly as returned — a composite of confidence/proximity/rating/
    // open-now (see apps/api/src/modules/search/ranking.ts), which the
    // grouping above preserves via Map insertion order. Only the other
    // three sorts need an explicit client-side re-sort.
    if (req.sort === 'distance' || req.sort === 'price_low' || req.sort === 'price_high') {
      const offerCmp = (a: ShopOffer, b: ShopOffer) =>
        req.sort === 'price_low' ? a.price - b.price
        : req.sort === 'price_high' ? b.price - a.price
        : a.shop.distanceMeters - b.shop.distanceMeters
      for (const g of result) g.offers.sort(offerCmp)
      result.sort((a, b) => offerCmp(a.offers[0], b.offers[0]))
    }
    return result
  },

  async getProductDetail(req: GetProductDetailRequest): Promise<ProductDetailResponse> {
    if (!req.productName) {
      // The API has no GET /api/products/:id — without a name to search
      // shop inventories by (normally supplied by the page that linked
      // here), this product can't be located at all.
      throw new ApiError('NOT_FOUND', 'Open this item from search or a shop’s product grid to see its details.')
    }
    const nearby = await apiFetch<{ shops: RawShopRow[] }>(
      `/api/shops/nearby?${qs({ lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters })}`,
    )
    const perShop = await Promise.all(
      nearby.shops.map(async (shopRow) => {
        const items = await fetchAllInventory(shopRow.id, req.productName)
        const match = items.find((it) => it.productId === req.productId)
        return match ? { shopRow, match } : null
      }),
    )
    const found = perShop.filter((x): x is { shopRow: RawShopRow; match: RawInventoryItem } => x !== null)

    if (found.length === 0) {
      // Genuinely zero shops in radius currently list it — the mock
      // renders this as an empty offers list, not an error, so we do too.
      return {
        product: {
          id: req.productId, name: req.productName, nameGu: req.productName,
          unitType: 'PIECE', defaultUnitLabel: '', imageUrl: null,
        },
        offers: [],
      }
    }

    const product = toProduct(found[0].match.product)
    const offers: ShopOffer[] = found
      .map(({ shopRow, match }) => ({ ...toOffer(match), shop: toShopSummary(shopRow) }))
      .sort((a, b) => a.shop.distanceMeters - b.shop.distanceMeters)
    return { product, offers }
  },

  async multiItemSearch(req: MultiItemSearchRequest): Promise<MultiItemSearchResponse> {
    const [raw, nearby] = await Promise.all([
      apiFetch<RawMultiSearchResponse>('/api/search/multi', {
        method: 'POST',
        body: JSON.stringify({ items: req.items, lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters }),
      }),
      apiFetch<{ shops: RawShopRow[] }>(
        `/api/shops/nearby?${qs({ lat: req.location.lat, lng: req.location.lng, radius: req.radiusMeters })}`,
      ),
    ])
    const shopMap = new Map(nearby.shops.map((row) => [row.id, toShopSummary(row)]))
    const shopRefToSummary = (ref: RawMultiSearchShopRef): ShopSummary =>
      shopMap.get(ref.id) ?? { id: ref.id, name: ref.name, distanceMeters: ref.distanceMeters, isOpenNow: true }

    const matches: MatchedItem[] = req.items.map((queryText) => ({ queryText, matchedProduct: null }))
    const fillMatches = (coverage: ShopCoverage) => {
      for (const c of coverage.itemsCovered) {
        const m = matches.find((m) => m.queryText === c.queryText)
        if (m && !m.matchedProduct) m.matchedProduct = c.product
      }
    }

    if (!raw.bestShop.shop) {
      return { matches, bestSingleShop: null, otherShops: [], twoShopSplit: null }
    }

    const bestCoverage = await buildCoverage(
      raw.bestShop.shop.id, shopRefToSummary(raw.bestShop.shop), raw.bestShop.covered, req.items,
    )
    fillMatches(bestCoverage)

    let twoShopSplit: MultiItemSearchResponse['twoShopSplit'] = null
    const secondRaw = raw.split[1]
    if (secondRaw) {
      const secondCoverage = await buildCoverage(
        secondRaw.shop.id, shopRefToSummary(secondRaw.shop), secondRaw.covered, req.items,
      )
      fillMatches(secondCoverage)
      const combined = new Set([
        ...bestCoverage.itemsCovered.map((i) => i.queryText),
        ...secondCoverage.itemsCovered.map((i) => i.queryText),
      ])
      twoShopSplit = {
        primary: bestCoverage, secondary: secondCoverage,
        combinedCoveredCount: combined.size,
        stillMissing: req.items.filter((i) => !combined.has(i)),
      }
    }

    // The API only ever returns the best shop plus one greedy split
    // partner — no ranked list of further alternates exists to show here.
    return { matches, bestSingleShop: bestCoverage, otherShops: [], twoShopSplit }
  },

  // -- Auth --------------------------------------------------------------

  async requestOtp(req: RequestOtpRequest) {
    return apiFetch<{ sent: boolean }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone: req.phone, role: 'CUSTOMER' }),
    })
  },

  async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const data = await apiFetch<VerifyOtpResponse>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: req.phone, otp: req.otp }),
    })
    setTokens(data)
    setStoredUser(data.user)
    return data
  },

  async completeProfile(req: CompleteProfileRequest): Promise<CompleteProfileResponse> {
    const data = await apiFetch<{ user: AuthUser; address: Address }>('/api/auth/customer/profile', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    setStoredUser(data.user)
    return data
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!getAccessToken()) return null
    try {
      const me = await apiFetch<AuthUser>('/api/auth/me')
      setStoredUser(me)
      return me
    } catch {
      // Expired refresh token, server unreachable, or user deleted —
      // either way, browsing anonymously is the right fallback, not a
      // blank crash at app startup.
      return null
    }
  },

  async logout() {
    clearTokens()
  },
}

/**
 * Ordering/checkout don't exist on the real API yet (spec: another agent is
 * building them). These seven methods are the mock, verbatim, so cart,
 * checkout and order tracking keep working against realistic demo data
 * until that lands — swapping them to the real thing later is exactly
 * these seven lines.
 */
export const realClient: ShopNearApi = {
  ...catalogueAndSearchClient,
  createOrder: mockClient.createOrder,
  getOrder: mockClient.getOrder,
  listOrders: mockClient.listOrders,
  cancelOrder: mockClient.cancelOrder,
  submitReview: mockClient.submitReview,
  raiseDispute: mockClient.raiseDispute,
}
