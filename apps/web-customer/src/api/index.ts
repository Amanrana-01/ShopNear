import type { ShopNearApi } from './client'
import { mockClient } from './mockClient'

/**
 * Single switch point between the mock API and the real backend.
 *
 * Today only the mock exists. When the real API is ready, add a
 * `realClient.ts` that implements `ShopNearApi` against
 * `VITE_API_BASE_URL`, then this becomes:
 *
 *   export const api: ShopNearApi = useReal ? realClient : mockClient
 *
 * Nothing else in the app needs to change — every screen imports `api`
 * from this file only.
 */
const useReal = import.meta.env.VITE_USE_REAL_API === 'true'

if (useReal) {
  // eslint-disable-next-line no-console
  console.warn('[shopnear] VITE_USE_REAL_API=true but no real client is wired up yet — falling back to mock.')
}

export const api: ShopNearApi = mockClient

export type { ShopNearApi, ProductDetailResponse } from './client'
