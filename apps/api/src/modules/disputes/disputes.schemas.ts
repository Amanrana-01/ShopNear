import { z } from 'zod'

/**
 * Zod contracts for the disputes endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/disputes.ts`, but another agent owns
 * `packages/shared/` right now — see `apps/api/src/modules/auth/auth.schemas.ts`
 * for the same note. These live under `apps/api/src/modules/disputes/` instead.
 */

export const orderIdParamSchema = z.object({ orderId: z.string().min(1) })
export type OrderIdParamInput = z.infer<typeof orderIdParamSchema>

export const disputeIdParamSchema = z.object({ id: z.string().min(1) })
export type DisputeIdParamInput = z.infer<typeof disputeIdParamSchema>

const DISPUTE_REASONS = [
  'ITEM_NOT_AVAILABLE_ON_ARRIVAL',
  'PRICE_MISMATCH',
  'QUALITY_ISSUE',
  'SHOP_CLOSED',
  'OTHER',
] as const

export const createDisputeSchema = z.object({
  reason: z.enum(DISPUTE_REASONS),
  description: z.string().trim().min(1).max(2000),
})
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>

export const listDisputesQuerySchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'REJECTED']).optional(),
})
export type ListDisputesQueryInput = z.infer<typeof listDisputesQuerySchema>

export const resolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  adminNote: z.string().trim().min(1).max(2000),
})
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
