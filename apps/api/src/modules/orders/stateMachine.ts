import type { OrderStatus, OrderType } from '@prisma/client'
import { badRequest } from '../../http/errors'

/**
 * The order state machine (spec §6) — the single most important contract in
 * this phase. Every status change in `orders.service.ts` must go through
 * `assertTransition` first; nothing writes `order.status` directly.
 *
 * ```
 * PLACED     -> CONFIRMED | REJECTED_BY_SHOP | CANCELLED_BY_CUSTOMER | EXPIRED
 * CONFIRMED  -> READY_FOR_PICKUP | OUT_FOR_DELIVERY | CANCELLED_BY_CUSTOMER
 * READY_FOR_PICKUP -> COMPLETED
 * OUT_FOR_DELIVERY -> COMPLETED          (DELIVERY orders only)
 * COMPLETED / REJECTED_BY_SHOP / CANCELLED_BY_CUSTOMER / EXPIRED -> terminal
 * ```
 *
 * `READY_FOR_PICKUP` and `OUT_FOR_DELIVERY` are listed as siblings reachable
 * from `CONFIRMED` in the state-shape table above, but they are not
 * interchangeable: a `RESERVE_AND_COLLECT` order can only ever reach
 * `READY_FOR_PICKUP`, a `DELIVERY` order only `OUT_FOR_DELIVERY`. That
 * per-type restriction lives here, not just in the service layer, so it is
 * impossible to construct a state machine call that gets it wrong.
 */
export const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'REJECTED_BY_SHOP', 'CANCELLED_BY_CUSTOMER', 'EXPIRED'],
  CONFIRMED: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED_BY_CUSTOMER'],
  READY_FOR_PICKUP: ['COMPLETED'],
  OUT_FOR_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED_BY_CUSTOMER: [],
  REJECTED_BY_SHOP: [],
  EXPIRED: [],
}

/**
 * Throws a 400 `AppError` on any illegal transition — including one that is
 * shape-legal (present in `LEGAL_TRANSITIONS`) but wrong for this order's
 * `orderType`. Callers never need to check `LEGAL_TRANSITIONS` themselves;
 * this is the one gate every status change passes through.
 */
export function assertTransition(from: OrderStatus, to: OrderStatus, orderType: OrderType): void {
  const allowed = LEGAL_TRANSITIONS[from] ?? []
  if (!allowed.includes(to)) {
    throw badRequest(`Illegal order transition: ${from} -> ${to}.`)
  }

  if (to === 'READY_FOR_PICKUP' && orderType !== 'RESERVE_AND_COLLECT') {
    throw badRequest('READY_FOR_PICKUP is only valid for RESERVE_AND_COLLECT orders.')
  }
  if (to === 'OUT_FOR_DELIVERY' && orderType !== 'DELIVERY') {
    throw badRequest('OUT_FOR_DELIVERY is only valid for DELIVERY orders.')
  }
}
