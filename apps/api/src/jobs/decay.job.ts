import { prisma } from '../db'
import * as clock from '../clock/clock'
import { getDecayThresholds } from '../config/runtimeConfig'

/**
 * The availability decay job (spec §7). A small shop that confirmed "have
 * it" 3 days ago and never touched the app again should not keep showing as
 * a confident "In stock" forever — badges already degrade this at *read*
 * time via `computeBadge`, but the underlying `ShopInventory.availability`
 * enum needs to catch up too, both so the signal itself stops being trusted
 * as a hard positive/negative, and so the audit trail
 * (`AvailabilityEvent`/`AUTO_DECAY`) reflects that the system, not a person,
 * made the call.
 *
 * Exported and directly invocable — the demo panel's time-travel button and
 * this module's own tests call it synchronously, no cron required. `index.ts`
 * additionally schedules it hourly via node-cron for the (unattended) real
 * server process.
 *
 * `clock.now()` and the runtime thresholds are read fresh on every call —
 * never hard-coded — so the admin panel's sliders and the demo clock both
 * take effect immediately.
 */
export async function runDecayJob(): Promise<{ decayedCount: number }> {
  const now = clock.now()
  const thresholds = await getDecayThresholds()

  const inStockCutoff = new Date(now.getTime() - thresholds.inStockStaleHours * 60 * 60 * 1000)
  const outOfStockCutoff = new Date(now.getTime() - thresholds.outOfStockTrustHours * 60 * 60 * 1000)

  const [staleInStock, staleOutOfStock] = await Promise.all([
    prisma.shopInventory.findMany({
      where: { availability: 'IN_STOCK', availabilityUpdatedAt: { lt: inStockCutoff } },
    }),
    prisma.shopInventory.findMany({
      where: { availability: 'OUT_OF_STOCK', availabilityUpdatedAt: { lt: outOfStockCutoff } },
    }),
  ])

  const staleRows = [...staleInStock, ...staleOutOfStock]
  if (staleRows.length === 0) return { decayedCount: 0 }

  await prisma.$transaction([
    prisma.shopInventory.updateMany({
      where: { id: { in: staleRows.map((row) => row.id) } },
      data: { availability: 'USUALLY_AVAILABLE', availabilityUpdatedAt: now, availabilitySource: 'AUTO_DECAY' },
    }),
    prisma.availabilityEvent.createMany({
      data: staleRows.map((row) => ({
        shopId: row.shopId,
        productId: row.productId,
        previousAvailability: row.availability,
        newAvailability: 'USUALLY_AVAILABLE' as const,
        source: 'AUTO_DECAY' as const,
      })),
    }),
  ])

  return { decayedCount: staleRows.length }
}
