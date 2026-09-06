import type { ShopNearApi } from './client'
import { mockClient } from './mockClient'
import { realClient } from './realClient'

/**
 * Single switch point between the mock API and the real backend.
 *
 * The **mock is the default**, so `npm run dev` brings the app up fully
 * populated with no database, no API process and no network: 297 shops across
 * nine trades, ~470 products and ~28k offer rows, all generated from a
 * seeded PRNG in `fixtures/` so every reload yields the identical catalogue.
 *
 * Set `VITE_USE_MOCK=false` to point the app at the live backend on
 * `VITE_API_URL` instead. Both clients implement the same `ShopNearApi`, so
 * nothing else in the app changes either way — every screen imports `api`
 * from this file only.
 *
 * The default is deliberately set here rather than in a `.env` file, because
 * `.env` is gitignored: a default that only exists on one machine is not a
 * default.
 *
 * Note: `realClient` itself re-exports the mock's review/dispute methods
 * verbatim (those endpoints don't exist on the API yet) — see the comment
 * at the bottom of `realClient.ts`.
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const api: ShopNearApi = useMock ? mockClient : realClient

export type { ShopNearApi, ProductDetailResponse } from './client'
