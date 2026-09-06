import { adminFetch, qs, setTokens, setStoredUser, clearTokens } from './client'
import type {
  AuthUser, Dispute, DisputeStatus, ShopRow, SearchResultRow, RankingWeights, DecayThresholds,
} from '@/types'

// ---------------------------------------------------------------------------
// Auth — real, live endpoints (apps/api/src/modules/auth).
// ---------------------------------------------------------------------------

export async function adminLogin(email: string, password: string): Promise<AuthUser> {
  const data = await adminFetch<{ user: AuthUser; accessToken: string; refreshToken: string }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setTokens(data)
  setStoredUser(data.user)
  return data.user
}

export async function getMe(): Promise<AuthUser> {
  const me = await adminFetch<AuthUser>('/api/auth/me')
  setStoredUser(me)
  return me
}

export async function logout(): Promise<void> {
  clearTokens()
}

// ---------------------------------------------------------------------------
// Disputes — real, live endpoints (apps/api/src/modules/disputes).
// ---------------------------------------------------------------------------

export async function listDisputes(status?: DisputeStatus): Promise<Dispute[]> {
  const { disputes } = await adminFetch<{ disputes: Dispute[] }>(`/api/admin/disputes?${qs({ status })}`)
  return disputes
}

export async function resolveDispute(id: string, status: 'RESOLVED' | 'REJECTED', adminNote: string): Promise<Dispute> {
  const { dispute } = await adminFetch<{ dispute: Dispute }>(`/api/admin/disputes/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status, adminNote }),
  })
  return dispute
}

// ---------------------------------------------------------------------------
// Search & shop detail — real, live, public endpoints. Used directly by the
// customer app; reused here to power the ranking-weight live re-rank demo
// and the catalogue duplicate-detector preview (see those pages for why).
// ---------------------------------------------------------------------------

export async function searchLive(q: string, lat: number, lng: number, radius: number, pageSize = 50): Promise<{ results: SearchResultRow[]; total: number }> {
  return adminFetch(`/api/search?${qs({ q, lat, lng, radius, pageSize })}`)
}

export async function getShopById(id: string): Promise<ShopRow> {
  const res = await adminFetch<{ shop: ShopRow }>(`/api/shops/${id}`)
  return res.shop
}

/** GET /api/shops/nearby — real, public, live. Only ever returns ACTIVE
 * shops (by design, see shops.service.ts), so this is genuine data for "how
 * many active shops of each type are there", but cannot stand in for a full
 * shop list (PENDING/SUSPENDED shops are structurally excluded). */
export async function getActiveShopsNearby(lat: number, lng: number, radius: number): Promise<ShopRow[]> {
  const res = await adminFetch<{ shops: ShopRow[] }>(`/api/shops/nearby?${qs({ lat, lng, radius })}`)
  return res.shops
}

// ---------------------------------------------------------------------------
// Endpoints that DO NOT EXIST YET on the API. Each function below calls the
// most reasonable guessed contract and, on the API's generic "route not
// registered" 404, throws EndpointNotAvailableError (via `notYetAvailable`)
// naming exactly what's missing — pages catch that to render an honest
// empty state rather than fabricating data. See the phase-5 report's
// "Missing endpoints" section for the full, precise list.
// ---------------------------------------------------------------------------

/** MISSING: GET /api/admin/shops?status=... — list all shops for the
 * approval queue (nearby only returns ACTIVE shops; there is no way to
 * enumerate PENDING/SUSPENDED shops via any existing route). */
export async function listShopsForApproval(): Promise<ShopRow[]> {
  const res = await adminFetch<{ shops: ShopRow[] }>('/api/admin/shops?status=PENDING,SUSPENDED', {
    notYetAvailable: ['GET /api/admin/shops'],
  })
  return res.shops
}

/** MISSING: POST /api/admin/shops/:id/approve and .../reject — flip a
 * PENDING/SUSPENDED shop's status. `shops.routes.ts` only exposes a
 * merchant-owner PATCH, which an ADMIN token cannot pass (ownership check is
 * independent of role). */
export async function setShopStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<ShopRow> {
  const res = await adminFetch<{ shop: ShopRow }>(`/api/admin/shops/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
    notYetAvailable: ['POST /api/admin/shops/:id/status (or /approve, /reject)'],
  })
  return res.shop
}

/** MISSING: GET /api/admin/orders — list/filter every order across every
 * shop. `GET /api/orders/shop/:shopId` exists but is merchant-owner-only
 * (requireShopOwnership 403s any ADMIN token), and there is no "list all
 * shops" endpoint to even enumerate shopIds to try it against. */
export async function listAllOrdersForAdmin(params: { status?: string; shopId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
  return adminFetch<{ orders: unknown[]; total: number }>(`/api/admin/orders?${qs(params)}`, {
    notYetAvailable: ['GET /api/admin/orders'],
  })
}

/** MISSING: no Product CRUD or listing route exists at all — no
 * GET /api/admin/products, POST, PATCH, DELETE, or a merge action. */
export async function listAllProducts(params: { page?: number; pageSize?: number; q?: string }) {
  return adminFetch<{ products: unknown[]; total: number }>(`/api/admin/products?${qs(params)}`, {
    notYetAvailable: ['GET /api/admin/products', 'POST /api/admin/products', 'PATCH /api/admin/products/:id', 'DELETE /api/admin/products/:id'],
  })
}

export async function mergeProducts(keepId: string, mergeId: string) {
  return adminFetch<{ ok: boolean }>('/api/admin/products/merge', {
    method: 'POST',
    body: JSON.stringify({ keepId, mergeId }),
    notYetAvailable: ['POST /api/admin/products/merge'],
  })
}

/** MISSING: GET/PUT /api/admin/config — runtimeConfig.ts persists ranking
 * weights and decay thresholds as AppSetting rows, but no HTTP route reads
 * or writes them; only search.service.ts consumes them server-side. */
export async function getRankingWeights() {
  return adminFetch<{ weights: RankingWeights }>('/api/admin/config/ranking-weights', {
    notYetAvailable: ['GET /api/admin/config/ranking-weights'],
  })
}
export async function setRankingWeights(weights: RankingWeights) {
  return adminFetch<{ weights: RankingWeights }>('/api/admin/config/ranking-weights', {
    method: 'PUT',
    body: JSON.stringify(weights),
    notYetAvailable: ['PUT /api/admin/config/ranking-weights'],
  })
}
export async function getDecayThresholds() {
  return adminFetch<{ thresholds: DecayThresholds }>('/api/admin/config/decay-thresholds', {
    notYetAvailable: ['GET /api/admin/config/decay-thresholds'],
  })
}
export async function setDecayThresholds(thresholds: DecayThresholds) {
  return adminFetch<{ thresholds: DecayThresholds }>('/api/admin/config/decay-thresholds', {
    method: 'PUT',
    body: JSON.stringify(thresholds),
    notYetAvailable: ['PUT /api/admin/config/decay-thresholds'],
  })
}

/** MISSING: any analytics endpoint at all — orders-per-day,
 * confirmation-rate-per-shop, median-merchant-response-time,
 * top-zero-result-searches (SearchLog has no route), and
 * availability-accuracy-rate (AvailabilityEvent has no route). */
export async function getAnalyticsOverview() {
  return adminFetch<Record<string, unknown>>('/api/admin/analytics/overview', {
    notYetAvailable: [
      'GET /api/admin/analytics/orders-per-day',
      'GET /api/admin/analytics/confirmation-rate-per-shop',
      'GET /api/admin/analytics/merchant-response-time',
      'GET /api/admin/analytics/zero-result-searches (needs SearchLog exposed)',
      'GET /api/admin/analytics/availability-accuracy (needs AvailabilityEvent exposed)',
    ],
  })
}
