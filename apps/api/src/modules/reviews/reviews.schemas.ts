import { z } from 'zod'

/**
 * Zod contracts for the reviews endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/reviews.ts`, but another agent owns
 * `packages/shared/` right now — see `apps/api/src/modules/auth/auth.schemas.ts`
 * for the same note. These live under `apps/api/src/modules/reviews/` instead.
 */

export const orderIdParamSchema = z.object({ orderId: z.string().min(1) })
export type OrderIdParamInput = z.infer<typeof orderIdParamSchema>

export const shopIdParamSchema = z.object({ shopId: z.string().min(1) })
export type ShopIdParamInput = z.infer<typeof shopIdParamSchema>

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})
export type CreateReviewInput = z.infer<typeof createReviewSchema>
