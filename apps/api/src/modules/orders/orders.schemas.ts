import { z } from 'zod'

/**
 * Zod contracts for the orders endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/orders.ts`, but another agent owns
 * `packages/shared/` right now — see `apps/api/src/modules/auth/auth.schemas.ts`
 * for the same note. These live under `apps/api/src/modules/orders/` instead.
 */

export const orderIdParamSchema = z.object({ id: z.string().min(1) })
export type OrderIdParamInput = z.infer<typeof orderIdParamSchema>

export const shopIdParamSchema = z.object({ shopId: z.string().min(1) })
export type ShopIdParamInput = z.infer<typeof shopIdParamSchema>

export const createOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
})

export const createOrderSchema = z.object({
  shopId: z.string().min(1),
  type: z.enum(['RESERVE_AND_COLLECT', 'DELIVERY']),
  items: z.array(createOrderItemSchema).min(1),
  paymentMode: z.enum(['CASH_ON_PICKUP', 'CASH_ON_DELIVERY', 'MOCK_ONLINE']),
  deliveryAddressId: z.string().optional(),
  customerNote: z.string().optional(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

/**
 * The merchant's one-tap confirm screen (spec §9): "Have it" / "Don't have
 * it" per line item, then a single confirm. `substituteProductId` is only
 * meaningful when `fulfilmentStatus` is `SUBSTITUTED`.
 */
export const resolveOrderItemSchema = z.object({
  orderItemId: z.string().min(1),
  fulfilmentStatus: z.enum(['AVAILABLE', 'UNAVAILABLE', 'SUBSTITUTED']),
  substituteProductId: z.string().optional(),
})

export const confirmOrderSchema = z.object({
  items: z.array(resolveOrderItemSchema).min(1),
})
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>

export const rejectOrderSchema = z.object({
  reason: z.string().min(1),
})
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>

export const completeOrderSchema = z.object({
  // Required for RESERVE_AND_COLLECT orders (spec §6); a DELIVERY order
  // completes without one, so this stays optional at the schema level and
  // is enforced in the service where the order's type is known.
  pickupCode: z.string().optional(),
})
export type CompleteOrderInput = z.infer<typeof completeOrderSchema>
