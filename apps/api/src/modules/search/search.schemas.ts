import { z } from 'zod'

/**
 * Zod contracts for the search endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/search.ts`, but another agent owns
 * `packages/shared/` right now — see `apps/api/src/modules/auth/auth.schemas.ts`
 * for the same note. These live under `apps/api/src/modules/search/` instead.
 */

const latSchema = z.coerce.number().gte(-90).lte(90)
const lngSchema = z.coerce.number().gte(-180).lte(180)

// Deliberately not restricted to ALLOWED_SEARCH_RADII_M for the same reason
// as the shops module's nearby query — see shops.schemas.ts.
const radiusSchema = z.coerce.number().positive().max(5000).default(1000)

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  lat: latSchema,
  lng: lngSchema,
  radius: radiusSchema,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})
export type SearchQueryInput = z.infer<typeof searchQuerySchema>

export const multiSearchBodySchema = z.object({
  items: z.array(z.string().min(1)).min(1).max(20),
  lat: latSchema,
  lng: lngSchema,
  radius: radiusSchema,
})
export type MultiSearchBodyInput = z.infer<typeof multiSearchBodySchema>
