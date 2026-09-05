import type {
  LocationPreset, Category, ShopSummary, ShopDetail, InventoryEntry,
  GetShopsNearbyRequest, SearchProductsRequest, ProductSearchGroup,
  GetProductDetailRequest, ShopOffer, GetShopInventoryRequest,
  MultiItemSearchRequest, MultiItemSearchResponse, MatchedItem, ShopCoverage,
  CreateOrderRequest, Order, OrderItem, SubmitReviewRequest, RaiseDisputeRequest,
  Dispute, RequestOtpRequest, VerifyOtpRequest, Session, AuthUser, Product, GeoPoint,
} from '@shopnear/shared'
import type { ShopNearApi, ProductDetailResponse } from './client'
import { LOCATION_PRESETS } from './fixtures/location'
import { CATEGORIES } from './fixtures/categories'
import { PRODUCTS, PRODUCT_BY_ID, SEARCH_KEYWORDS_BY_PRODUCT_ID } from './fixtures/products'
import { SHOPS, SHOP_DETAILS, isOpenNow } from './fixtures/shops'
import { offersForProduct, offersForShop, offerFor } from './fixtures/inventory'
import { seedOrders } from './fixtures/orders'
import { haversineMetres, latency, nextId } from './fixtures/helpers'

const DEMO_OTP = '123456'
const ORDERS_KEY = 'shopnear.orders.v1'
const SESSION_KEY = 'shopnear.session.v1'

// ---------------------------------------------------------------------------
// Small local persistence helpers (localStorage is the only "backend" a
// fully client-side mock has for anything that must survive a reload).
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can throw in private-browsing edge cases — demo degrades
    // to in-memory-only persistence for that tab, which is fine.
  }
}

function loadOrders(): Order[] {
  const stored = readJson<Order[] | null>(ORDERS_KEY, null)
  if (stored && stored.length > 0) return stored
  const seed = seedOrders()
  writeJson(ORDERS_KEY, seed)
  return seed
}
let ORDERS: Order[] = loadOrders()
function persistOrders() {
  writeJson(ORDERS_KEY, ORDERS)
}

// ---------------------------------------------------------------------------
// Live-field materialisation — distance and open/closed depend on the
// caller's current location and the current time, so they're computed fresh
// on every call rather than baked into the fixture.
// ---------------------------------------------------------------------------

function liveShopSummary(shopId: string, location: GeoPoint): ShopSummary | undefined {
  const base = SHOPS.find((s) => s.id === shopId)
  const detail = SHOP_DETAILS.get(shopId)
  if (!base || !detail) return undefined
  return {
    ...base,
    distanceMeters: Math.round(haversineMetres(location.lat, location.lng, base.lat, base.lng)),
    isOpenNow: isOpenNow(detail.openingHours),
  }
}

function shopsWithinRadius(location: GeoPoint, radiusMeters: number): ShopSummary[] {
  return SHOPS
    .map((s) => liveShopSummary(s.id, location)!)
    .filter((s) => s.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}

// ---------------------------------------------------------------------------
// Text search — case-insensitive match against name, brand, and the
// Hindi/Gujarati transliteration keywords carried in the fixture.
// ---------------------------------------------------------------------------

function matchScore(product: Product, needle: string): number {
  const q = needle.trim().toLowerCase()
  if (!q) return 0
  const keywords = SEARCH_KEYWORDS_BY_PRODUCT_ID.get(product.id) ?? []
  if (product.name.toLowerCase() === q) return 100
  if (keywords.includes(q)) return 90
  if (product.name.toLowerCase().startsWith(q)) return 70
  if (keywords.some((k) => k.startsWith(q))) return 60
  if (product.name.toLowerCase().includes(q)) return 40
  if (keywords.some((k) => k.includes(q))) return 35
  if (product.brand?.toLowerCase().includes(q)) return 25
  return 0
}

function findMatchingProducts(query: string): Product[] {
  return PRODUCTS
    .map((p) => ({ p, score: matchScore(p, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)
}

function bestMatchFor(query: string): Product | null {
  const matches = findMatchingProducts(query)
  return matches[0] ?? null
}

// ---------------------------------------------------------------------------
// Order status is derived from elapsed time rather than mutated by timers,
// so it stays correct across reloads and however long the demo pauses on a
// screen. Only cancel/terminal states are ever written back to storage.
// ---------------------------------------------------------------------------

const TERMINAL: Order['status'][] = [
  'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED',
]

function deriveStatus(order: Order): Order {
  if (TERMINAL.includes(order.status)) return order
  const createdAt = new Date(order.createdAt).getTime()
  const elapsedMs = Date.now() - createdAt
  const expiresAt = order.expiresAt ? new Date(order.expiresAt).getTime() : null

  if (expiresAt && Date.now() > expiresAt) {
    return { ...order, status: 'EXPIRED', expiredAt: new Date(expiresAt).toISOString() }
  }

  if (order.type === 'RESERVE_AND_COLLECT') {
    if (elapsedMs < 8_000) return { ...order, status: 'PLACED' }
    if (elapsedMs < 25_000) return { ...order, status: 'CONFIRMED', confirmedAt: order.confirmedAt ?? new Date(createdAt + 8_000).toISOString() }
    return {
      ...order, status: 'READY_FOR_PICKUP',
      confirmedAt: order.confirmedAt ?? new Date(createdAt + 8_000).toISOString(),
      readyAt: order.readyAt ?? new Date(createdAt + 25_000).toISOString(),
    }
  }
  // DELIVERY
  if (elapsedMs < 8_000) return { ...order, status: 'PLACED' }
  if (elapsedMs < 25_000) return { ...order, status: 'CONFIRMED', confirmedAt: order.confirmedAt ?? new Date(createdAt + 8_000).toISOString() }
  if (elapsedMs < 60_000) {
    return {
      ...order, status: 'OUT_FOR_DELIVERY',
      confirmedAt: order.confirmedAt ?? new Date(createdAt + 8_000).toISOString(),
      outForDeliveryAt: order.outForDeliveryAt ?? new Date(createdAt + 25_000).toISOString(),
    }
  }
  return {
    ...order, status: 'COMPLETED',
    confirmedAt: order.confirmedAt ?? new Date(createdAt + 8_000).toISOString(),
    outForDeliveryAt: order.outForDeliveryAt ?? new Date(createdAt + 25_000).toISOString(),
    completedAt: order.completedAt ?? new Date(createdAt + 60_000).toISOString(),
  }
}

function fourDigitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// ---------------------------------------------------------------------------

export const mockClient: ShopNearApi = {
  async getLocationPresets() {
    await latency(150, 100)
    return LOCATION_PRESETS
  },

  async getCategories() {
    await latency()
    return CATEGORIES
  },

  async getShopsNearby(req: GetShopsNearbyRequest) {
    await latency()
    let shops = shopsWithinRadius(req.location, req.radiusMeters)
    if (req.type) shops = shops.filter((s) => s.type === req.type)
    if (req.query) {
      const q = req.query.toLowerCase()
      shops = shops.filter((s) => s.name.toLowerCase().includes(q))
    }
    return shops
  },

  async getShop(shopId: string) {
    await latency()
    const detail = SHOP_DETAILS.get(shopId)
    if (!detail) throw new Error('Shop not found')
    return { ...detail, isOpenNow: isOpenNow(detail.openingHours) } satisfies ShopDetail
  },

  async getShopInventory(req: GetShopInventoryRequest) {
    await latency()
    let entries: InventoryEntry[] = offersForShop(req.shopId)
    if (req.categorySlug) entries = entries.filter((e) => e.product.categorySlug === req.categorySlug)
    if (req.query) {
      const q = req.query.toLowerCase()
      entries = entries.filter((e) => matchScore(e.product, q) > 0)
    }
    return entries.sort((a, b) => a.product.name.localeCompare(b.product.name))
  },

  async searchProducts(req: SearchProductsRequest) {
    await latency(320, 280)
    const matches = req.query
      ? findMatchingProducts(req.query)
      : req.categorySlug
        ? PRODUCTS.filter((p) => p.categorySlug === req.categorySlug)
        : []
    const nearbyShopIds = new Set(shopsWithinRadius(req.location, req.radiusMeters).map((s) => s.id))

    const groups: ProductSearchGroup[] = matches
      .map((product) => {
        const offers: ShopOffer[] = offersForProduct(product.id)
          .filter((o) => nearbyShopIds.has(o.shopId))
          .map((o) => ({ ...o, shop: liveShopSummary(o.shopId, req.location)! }))
          .filter((o) => o.shop)
        return { product, offers }
      })
      .filter((g) => g.offers.length > 0)

    for (const g of groups) {
      g.offers.sort((a, b) => {
        if (req.sort === 'distance') return a.shop.distanceMeters - b.shop.distanceMeters
        if (req.sort === 'price_low') return a.price - b.price
        if (req.sort === 'price_high') return b.price - a.price
        return a.shop.distanceMeters - b.shop.distanceMeters // relevance defaults to nearest-first
      })
    }
    if (req.sort === 'price_low') groups.sort((a, b) => Math.min(...a.offers.map((o) => o.price)) - Math.min(...b.offers.map((o) => o.price)))
    else if (req.sort === 'price_high') groups.sort((a, b) => Math.min(...b.offers.map((o) => o.price)) - Math.min(...a.offers.map((o) => o.price)))
    else groups.sort((a, b) => Math.min(...a.offers.map((o) => o.shop.distanceMeters)) - Math.min(...b.offers.map((o) => o.shop.distanceMeters)))

    return groups
  },

  async getProductDetail(req: GetProductDetailRequest): Promise<ProductDetailResponse> {
    await latency()
    const product = PRODUCT_BY_ID.get(req.productId)
    if (!product) throw new Error('Product not found')
    const nearbyShopIds = new Set(shopsWithinRadius(req.location, req.radiusMeters).map((s) => s.id))
    const offers: ShopOffer[] = offersForProduct(product.id)
      .filter((o) => nearbyShopIds.has(o.shopId))
      .map((o) => ({ ...o, shop: liveShopSummary(o.shopId, req.location)! }))
      .sort((a, b) => a.shop.distanceMeters - b.shop.distanceMeters)
    return { product, offers }
  },

  async multiItemSearch(req: MultiItemSearchRequest): Promise<MultiItemSearchResponse> {
    await latency(400, 320)
    const matches: MatchedItem[] = req.items.map((queryText) => ({
      queryText, matchedProduct: bestMatchFor(queryText),
    }))
    const eligibleShops = shopsWithinRadius(req.location, req.radiusMeters)

    function coverageFor(shop: ShopSummary): ShopCoverage {
      const itemsCovered: ShopCoverage['itemsCovered'] = []
      const itemsMissing: string[] = []
      let estimatedTotal = 0
      for (const m of matches) {
        const offer = m.matchedProduct ? offerFor(shop.id, m.matchedProduct.id) : undefined
        if (m.matchedProduct && offer) {
          itemsCovered.push({ queryText: m.queryText, offer, product: m.matchedProduct })
          estimatedTotal += offer.price
        } else {
          itemsMissing.push(m.queryText)
        }
      }
      const totalCount = matches.length
      const coveredCount = itemsCovered.length
      return {
        shop, itemsCovered, itemsMissing, coveredCount, totalCount,
        coveragePercent: totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100),
        estimatedTotal,
      }
    }

    const coverages = eligibleShops.map(coverageFor).sort((a, b) => {
      if (b.coveredCount !== a.coveredCount) return b.coveredCount - a.coveredCount
      return a.shop.distanceMeters - b.shop.distanceMeters
    })

    const bestSingleShop = coverages[0] ?? null
    const otherShops = coverages.slice(1, 6)

    let twoShopSplit: MultiItemSearchResponse['twoShopSplit'] = null
    if (bestSingleShop && bestSingleShop.coveragePercent < 100 && coverages.length > 1) {
      const missingSet = new Set(bestSingleShop.itemsMissing)
      let bestSecondary: ShopCoverage | null = null
      let bestNewlyCovered = -1
      for (const candidate of coverages.slice(1)) {
        const newlyCovered = candidate.itemsCovered.filter((i) => missingSet.has(i.queryText)).length
        if (newlyCovered > bestNewlyCovered) {
          bestNewlyCovered = newlyCovered
          bestSecondary = candidate
        }
      }
      if (bestSecondary && bestNewlyCovered > 0) {
        const combinedCoveredQueries = new Set([
          ...bestSingleShop.itemsCovered.map((i) => i.queryText),
          ...bestSecondary.itemsCovered.map((i) => i.queryText),
        ])
        twoShopSplit = {
          primary: bestSingleShop,
          secondary: bestSecondary,
          combinedCoveredCount: combinedCoveredQueries.size,
          stillMissing: matches.map((m) => m.queryText).filter((q) => !combinedCoveredQueries.has(q)),
        }
      }
    }

    return { matches, bestSingleShop, otherShops, twoShopSplit }
  },

  async createOrder(req: CreateOrderRequest): Promise<Order> {
    await latency(500, 400)
    const detail = SHOP_DETAILS.get(req.shopId)
    if (!detail) throw new Error('Shop not found')
    const shopSummary = liveShopSummary(req.shopId, { lat: detail.lat, lng: detail.lng })!

    const items: OrderItem[] = req.items.map((line) => {
      const product = PRODUCT_BY_ID.get(line.productId)
      const offer = offerFor(req.shopId, line.productId)
      if (!product || !offer) throw new Error(`Product ${line.productId} is not available at this shop`)
      const lineTotal = Number((offer.price * line.quantity).toFixed(2))
      return {
        id: nextId('item'), productId: product.id, productNameSnapshot: product.name,
        unitLabelSnapshot: product.defaultUnitLabel, imageUrl: product.imageUrl,
        quantity: line.quantity, unitPrice: offer.price, lineTotal, fulfilmentStatus: 'PENDING',
      }
    })
    const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2))
    const deliveryFee = req.type === 'DELIVERY' ? detail.deliveryFee : 0
    const total = Number((subtotal + deliveryFee).toFixed(2))

    if (req.paymentMode === 'MOCK_ONLINE' && req.simulatePaymentOutcome === 'failure') {
      throw new Error('Payment failed. Please try another method or try again.')
    }
    const paymentStatus = req.paymentMode === 'MOCK_ONLINE' ? 'PAID' : 'PENDING'
    const createdAt = new Date()
    const order: Order = {
      id: nextId('order'), orderNumber: `SN-${Math.floor(2400 + Math.random() * 500)}`,
      status: 'PLACED', type: req.type, shop: shopSummary, items,
      subtotal, deliveryFee, total, paymentMode: req.paymentMode, paymentStatus,
      deliveryAddress: null, customerNote: req.customerNote ?? null, rejectionReason: null,
      pickupCode: fourDigitCode(),
      expiresAt: req.type === 'RESERVE_AND_COLLECT' ? new Date(createdAt.getTime() + 2 * 3_600_000).toISOString() : null,
      createdAt: createdAt.toISOString(), confirmedAt: null, readyAt: null, outForDeliveryAt: null,
      completedAt: null, cancelledAt: null, rejectedAt: null, expiredAt: null, review: null,
    }
    ORDERS = [order, ...ORDERS]
    persistOrders()
    return deriveStatus(order)
  },

  async getOrder(orderId: string) {
    await latency(150, 150)
    const order = ORDERS.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found')
    return deriveStatus(order)
  },

  async listOrders() {
    await latency()
    return ORDERS.map(deriveStatus).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async cancelOrder(orderId: string) {
    await latency(300, 200)
    const idx = ORDERS.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')
    const current = deriveStatus(ORDERS[idx])
    if (TERMINAL.includes(current.status) || current.status === 'READY_FOR_PICKUP' || current.status === 'OUT_FOR_DELIVERY') {
      throw new Error('This order can no longer be cancelled')
    }
    const cancelled: Order = { ...current, status: 'CANCELLED_BY_CUSTOMER', cancelledAt: new Date().toISOString() }
    ORDERS[idx] = cancelled
    persistOrders()
    return cancelled
  },

  async submitReview(req: SubmitReviewRequest) {
    await latency(300, 200)
    const idx = ORDERS.findIndex((o) => o.id === req.orderId)
    if (idx === -1) throw new Error('Order not found')
    ORDERS[idx] = { ...ORDERS[idx], review: { rating: req.rating, comment: req.comment ?? null } }
    persistOrders()
  },

  async raiseDispute(req: RaiseDisputeRequest): Promise<Dispute> {
    await latency(300, 200)
    const order = ORDERS.find((o) => o.id === req.orderId)
    if (!order) throw new Error('Order not found')
    return {
      id: nextId('dispute'), orderId: req.orderId, reason: req.reason, description: req.description,
      status: 'OPEN', adminNote: null, createdAt: new Date().toISOString(), resolvedAt: null,
    }
  },

  async requestOtp(req: RequestOtpRequest) {
    await latency(400, 300)
    return { devOtp: DEMO_OTP }
  },

  async verifyOtp(req: VerifyOtpRequest): Promise<Session> {
    await latency(400, 300)
    if (req.otp !== DEMO_OTP) throw new Error('Incorrect OTP. Please try again.')
    const user: AuthUser = {
      id: `user_${req.phone}`, name: 'Asha Shah', phone: req.phone, role: 'CUSTOMER',
    }
    const session: Session = { token: nextId('token'), user }
    writeJson(SESSION_KEY, session)
    return session
  },

  async getCurrentUser() {
    await latency(80, 60)
    const session = readJson<Session | null>(SESSION_KEY, null)
    return session?.user ?? null
  },

  async logout() {
    await latency(120, 80)
    localStorage.removeItem(SESSION_KEY)
  },
}
