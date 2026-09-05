import type { ShopNearApi } from './client'
import { mockClient } from './mockClient'
import { realClient } from './realClient'

/**
 * Single switch point between the mock API and the real backend.
 *
 * The real API is the default data source. Set `VITE_USE_MOCK=true` to
 * force the fully-offline mock instead (a demo fallback when the API isn't
 * reachable, or for working on the UI with no backend running at all).
 * Nothing else in the app needs to change — every screen imports `api`
 * from this file only.
 *
 * Note: `realClient` itself re-exports the mock's order/checkout methods
 * verbatim (those endpoints don't exist on the API yet) — see the comment
 * at the bottom of `realClient.ts`.
 */
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const api: ShopNearApi = useMock ? mockClient : realClient

export type { ShopNearApi, ProductDetailResponse } from './client'
