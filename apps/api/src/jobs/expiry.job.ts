import { prisma } from '../db'
import * as clock from '../clock/clock'
import { emitOrderUpdated } from '../realtime/io'
import { assertTransition } from '../modules/orders/stateMachine'

/**
 * Reservation expiry (spec §6): a `PLACED` order the shop never acted on
 * within `expiresAt` auto-expires. Only `PLACED` orders are ever touched —
 * anything already `CONFIRMED`/`READY_FOR_PICKUP`/etc. is left completely
 * alone even if its `expiresAt` (set once, at creation) is in the past,
 * because the shop already acted on it.
 *
 * Exported and directly invocable, same as `runDecayJob` — the demo panel
 * and this module's own tests call it synchronously; `index.ts` additionally
 * schedules it hourly via node-cron.
 */
export async function runExpiryJob(): Promise<{ expiredCount: number }> {
  const now = clock.now()

  const toExpire = await prisma.order.findMany({
    where: { status: 'PLACED', expiresAt: { lt: now } },
    include: { items: true },
  })

  for (const order of toExpire) {
    assertTransition(order.status, 'EXPIRED', order.type)
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'EXPIRED', expiredAt: now },
      include: { items: true },
    })
    // Spec §9/§12: a status change is a status change, even an automatic
    // one — the customer's tracking screen should reflect it live.
    emitOrderUpdated(updated.id, updated)
  }

  return { expiredCount: toExpire.length }
}
