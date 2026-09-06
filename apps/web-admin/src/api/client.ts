/**
 * Fetch wrapper for the admin panel. Modelled on
 * `apps/web-customer/src/api/realClient.ts`'s `apiFetch` (same error
 * envelope, same 401 -> refresh -> retry-once dance) but admin-only: no
 * mock client, no OTP.
 *
 * IMPORTANT — endpoint availability: several admin endpoints this app wants
 * do not exist yet on the API (see the phase-5 report for the full list).
 * The API's own 404 fallback (`apps/api/src/app.ts`) replies with
 * `{ error: { code: 'NOT_FOUND', message: 'This endpoint does not exist.' } }`
 * for literally any unmatched route — that exact code+message pair is the
 * one reliable signal that a route was never registered, as opposed to a
 * route that exists but 404s for a business reason (e.g. "Shop not found").
 * `adminFetch` turns that specific case into `EndpointNotAvailableError` so
 * screens can render an honest "not yet available" state instead of a
 * generic error.
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

/** Thrown when the API replies with its generic "route not registered" 404 —
 * i.e. this admin feature has no backend support yet. */
export class EndpointNotAvailableError extends Error {
  readonly endpoints: string[]
  constructor(endpoints: string[], message?: string) {
    super(message ?? `Not yet available — the API has no route for: ${endpoints.join(', ')}.`)
    this.name = 'EndpointNotAvailableError'
    this.endpoints = endpoints
  }
}

const ACCESS_KEY = 'shopnear.admin.accessToken.v1'
const REFRESH_KEY = 'shopnear.admin.refreshToken.v1'
const USER_KEY = 'shopnear.admin.user.v1'

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
}
function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
}
export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch { /* private-browsing edge case */ }
}
export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}
export function setStoredUser(user: unknown) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch { /* ignore */ }
}
export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch { return null }
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
    throw new ApiError('NETWORK_ERROR', 'Could not reach ShopNear to refresh the session.')
  }
  if (!res.ok) {
    clearTokens()
    throw new ApiError('UNAUTHORIZED', 'Your session has expired. Please log in again.')
  }
  setTokens(await res.json())
}

export interface AdminFetchOptions extends RequestInit {
  /** When the route 404s with the API's generic fallback, throw
   * EndpointNotAvailableError naming these endpoints instead of a plain ApiError. */
  notYetAvailable?: string[]
}

export async function adminFetch<T>(path: string, init: AdminFetchOptions = {}, allowRetry = true): Promise<T> {
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
    throw new ApiError('NETWORK_ERROR', `Could not reach ShopNear. Check your connection, or that the API is running on ${BASE_URL}.`)
  }

  if (res.status === 401 && accessToken && allowRetry) {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
    try {
      await refreshPromise
    } catch (e) {
      clearTokens()
      throw e
    }
    return adminFetch<T>(path, init, false)
  }

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; details?: unknown } } | null = null
    try { body = await res.json() } catch { /* non-JSON error body */ }
    const code = body?.error?.code ?? 'UNKNOWN_ERROR'
    const message = body?.error?.message ?? `Something went wrong (HTTP ${res.status}).`
    if (res.status === 404 && code === 'NOT_FOUND' && message === 'This endpoint does not exist.' && init.notYetAvailable) {
      throw new EndpointNotAvailableError(init.notYetAvailable)
    }
    throw new ApiError(code, message, body?.error?.details)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) usp.set(k, String(v))
  return usp.toString()
}

export { BASE_URL }
