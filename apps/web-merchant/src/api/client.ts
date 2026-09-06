import type {
  MerchantUser, Shop, ShopType, ShopInventoryItem, Order, StarterCatalogueItem, OpeningHours, FulfilmentStatus,
} from './types'

/**
 * Talks directly to the live API (port 4000 by default) — unlike
 * web-customer's phase-3 mock client, the API is already live for this
 * phase, so there is no mock layer here at all.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

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

const ACCESS_KEY = 'shopnear_merchant.accessToken.v1'
const REFRESH_KEY = 'shopnear_merchant.refreshToken.v1'

function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
}
function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
}
export function setTokens(tokens: { accessToken: string; refreshToken: string }): void {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch { /* private-browsing edge case */ }
}
export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch { /* ignore */ }
}
export function hasSession(): boolean {
  return getAccessToken() !== null
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
  const isFormData = init.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string> | undefined),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('NETWORK_ERROR', `Could not reach ShopNear. Check your connection, or that the API server is running on ${BASE_URL}.`)
  }

  if (res.status === 401 && accessToken && allowRetry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
    try {
      await refreshPromise
    } catch (e) {
      throw e
    }
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
// Auth
// ---------------------------------------------------------------------------

export async function merchantLogin(phone: string, password: string) {
  const data = await apiFetch<{ user: MerchantUser; accessToken: string; refreshToken: string }>(
    '/api/auth/merchant/login',
    { method: 'POST', body: JSON.stringify({ phone, password }) },
  )
  setTokens(data)
  return data.user
}

export async function getMe(): Promise<MerchantUser | null> {
  if (!hasSession()) return null
  try {
    return await apiFetch<MerchantUser>('/api/auth/me')
  } catch {
    return null
  }
}

export function logout(): void {
  clearTokens()
}

// ---------------------------------------------------------------------------
// Registration (spec §5 wizard step 7 submit)
// ---------------------------------------------------------------------------

export interface RegisterMerchantBody {
  owner: { name: string; phone: string; password: string; preferredLanguage: 'en' | 'hi' | 'gu' }
  shop: { name: string; nameGu: string; type: ShopType; description?: string; phone: string }
  location: { address: string; landmark?: string; pincode: string; lat: number; lng: number }
  openingHours: OpeningHours
  fulfilment: { acceptsDelivery: boolean; deliveryRadiusMeters: number; minOrderValue: number; deliveryFee: number }
  verification?: { licenceNumber?: string; licenceDocUrl?: string }
  starterItems: Array<{ productId: string; price: number }>
}

export async function registerMerchant(body: RegisterMerchantBody) {
  const data = await apiFetch<{ user: MerchantUser; shop: Shop; tokens: { accessToken: string; refreshToken: string } }>(
    '/api/merchants/register',
    { method: 'POST', body: JSON.stringify(body) },
  )
  setTokens(data.tokens)
  return data
}

export async function getStarterCatalogue(shopType: ShopType): Promise<StarterCatalogueItem[]> {
  const data = await apiFetch<{ items: StarterCatalogueItem[] }>(
    `/api/merchants/starter-catalogue?${qs({ shopType })}`,
  )
  return data.items
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const data = await apiFetch<{ url: string }>('/api/merchants/uploads', { method: 'POST', body: form })
  return `${BASE_URL}${data.url}`
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export async function getShopsNearby(lat: number, lng: number, radius = 5000, type?: ShopType): Promise<Shop[]> {
  const data = await apiFetch<{ shops: Shop[] }>(`/api/shops/nearby?${qs({ lat, lng, radius, type })}`)
  return data.shops
}

export async function getShopDetail(id: string): Promise<{ shop: Shop; inventorySummary: { totalItems: number; byAvailability: Record<string, number> } }> {
  return apiFetch(`/api/shops/${id}`)
}

export interface ShopPatchBody {
  name?: string
  nameGu?: string
  description?: string
  phone?: string
  address?: string
  lat?: number
  lng?: number
  openingHours?: OpeningHours
  acceptsDelivery?: boolean
  deliveryRadiusMeters?: number
  minOrderValue?: number
  deliveryFee?: number
  bannerImageUrl?: string
}

export async function patchShop(id: string, patch: ShopPatchBody): Promise<Shop> {
  const data = await apiFetch<{ shop: Shop }>(`/api/shops/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  return data.shop
}

export async function getShopInventoryPage(
  shopId: string, opts: { query?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: ShopInventoryItem[]; total: number; page: number; pageSize: number }> {
  return apiFetch(`/api/shops/${shopId}/inventory?${qs({ query: opts.query, page: opts.page ?? 1, pageSize: opts.pageSize ?? 100 })}`)
}

/** Fetches a shop's entire inventory, paginating past the API's 100/page cap. */
export async function getAllShopInventory(shopId: string, query?: string): Promise<ShopInventoryItem[]> {
  const pageSize = 100
  let page = 1
  const all: ShopInventoryItem[] = []
  for (;;) {
    const res = await getShopInventoryPage(shopId, { query, page, pageSize })
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0 || page > 20) break
    page += 1
  }
  return all
}

export interface InventoryPutItem {
  productId: string
  price: number
  availability?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'USUALLY_AVAILABLE' | 'UNKNOWN'
  notes?: string
}

export async function putShopInventory(shopId: string, items: InventoryPutItem[]): Promise<ShopInventoryItem[]> {
  const data = await apiFetch<{ items: ShopInventoryItem[] }>(`/api/shops/${shopId}/inventory`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
  return data.items
}

export async function copyInventoryFromShop(shopId: string, otherShopId: string): Promise<{ copiedCount: number }> {
  return apiFetch(`/api/shops/${shopId}/inventory/copy-from/${otherShopId}`, { method: 'POST' })
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listShopOrders(shopId: string): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>(`/api/orders/shop/${shopId}`)
  return data.orders
}

export async function getOrder(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}`)
  return data.order
}

export interface ResolveItem {
  orderItemId: string
  fulfilmentStatus: FulfilmentStatus
  substituteProductId?: string
}

export async function confirmOrder(id: string, items: ResolveItem[]): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  return data.order
}

export async function rejectOrder(id: string, reason: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return data.order
}

export async function markOutForDelivery(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}/out-for-delivery`, { method: 'POST' })
  return data.order
}

export async function completeOrder(id: string, pickupCode?: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/api/orders/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ pickupCode }),
  })
  return data.order
}

export { BASE_URL }
