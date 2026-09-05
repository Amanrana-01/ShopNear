import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { seedUsersAndShops } from './seedShops'
import { seedHistory } from './seedHistory'

describe('historical data seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "SearchLog", "AvailabilityEvent", "Dispute", "Review", "OrderItem", "Order", "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
    const rng = createRng(SEED)
    const catalogue = await seedCatalogue(prisma, rng)
    const ctx = await seedUsersAndShops(prisma, rng, catalogue)
    await seedHistory(prisma, rng, ctx)
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates roughly 120 orders', async () => {
    const count = await prisma.order.count()
    expect(count).toBeGreaterThanOrEqual(110)
    expect(count).toBeLessThanOrEqual(130)
  })

  it('spreads orders across the past 30 days', async () => {
    const rows = await prisma.$queryRaw<{ days: number }[]>`
      SELECT EXTRACT(DAY FROM (MAX("createdAt") - MIN("createdAt"))) AS days FROM "Order"
    `
    expect(Number(rows[0].days)).toBeGreaterThanOrEqual(25)
  })

  it('covers every terminal state so analytics have shape', async () => {
    const grouped = await prisma.order.groupBy({ by: ['status'], _count: true })
    const present = grouped.map((g) => g.status)
    for (const status of ['COMPLETED', 'REJECTED_BY_SHOP', 'EXPIRED', 'CANCELLED_BY_CUSTOMER'] as const) {
      expect(present, `missing ${status}`).toContain(status)
    }
    const completed = grouped.find((g) => g.status === 'COMPLETED')!
    expect(completed._count).toBeGreaterThan(50) // the healthy majority
  })

  it('gives every order at least one item with snapshots filled in', async () => {
    const orphan = await prisma.order.count({ where: { items: { none: {} } } })
    expect(orphan).toBe(0)
    const items = await prisma.orderItem.findMany({ take: 20 })
    for (const i of items) {
      expect(i.productNameSnapshot.length).toBeGreaterThan(0)
      expect(i.unitLabelSnapshot.length).toBeGreaterThan(0)
    }
  })

  it('keeps order totals consistent with their line items', async () => {
    const rows = await prisma.$queryRaw<{ bad: bigint }[]>`
      SELECT COUNT(*) AS bad FROM (
        SELECT o.id, o.subtotal, SUM(i."lineTotal") AS summed
        FROM "Order" o JOIN "OrderItem" i ON i."orderId" = o.id
        GROUP BY o.id, o.subtotal
        HAVING ABS(o.subtotal - SUM(i."lineTotal")) > 0.01
      ) mismatched
    `
    expect(Number(rows[0].bad)).toBe(0)
  })

  it('gives every order a unique four-digit pickup code', async () => {
    const orders = await prisma.order.findMany({ select: { pickupCode: true } })
    for (const o of orders) expect(o.pickupCode).toMatch(/^\d{4}$/)
  })

  it('creates exactly two open disputes for the admin queue', async () => {
    expect(await prisma.dispute.count({ where: { status: 'OPEN' } })).toBe(2)
  })

  it('creates roughly 60 reviews skewed positive but not uniform', async () => {
    const count = await prisma.review.count()
    expect(count).toBeGreaterThanOrEqual(50)
    expect(count).toBeLessThanOrEqual(70)
    const grouped = await prisma.review.groupBy({ by: ['rating'], _count: true })
    expect(grouped.length).toBeGreaterThan(2) // not all the same score
    const avg = await prisma.review.aggregate({ _avg: { rating: true } })
    expect(avg._avg.rating!).toBeGreaterThan(3.4)
    expect(avg._avg.rating!).toBeLessThan(4.8)
  })

  it('only attaches reviews to completed orders', async () => {
    const bad = await prisma.review.count({ where: { order: { status: { not: 'COMPLETED' } } } })
    expect(bad).toBe(0)
  })

  it('updates each shop rating to match its reviews', async () => {
    const shop = await prisma.shop.findFirst({ where: { ratingCount: { gt: 0 } } })
    expect(shop).not.toBeNull()
    const agg = await prisma.review.aggregate({
      where: { shopId: shop!.id }, _avg: { rating: true }, _count: true,
    })
    expect(shop!.ratingCount).toBe(agg._count)
    expect(shop!.avgRating).toBeCloseTo(agg._avg.rating!, 1)
  })

  it('writes availability events for confirmed and rejected reservations', async () => {
    const confirmed = await prisma.availabilityEvent.count({ where: { source: 'RESERVATION_CONFIRMED' } })
    const rejected = await prisma.availabilityEvent.count({ where: { source: 'RESERVATION_REJECTED' } })
    expect(confirmed).toBeGreaterThan(20)
    expect(rejected).toBeGreaterThan(5)
  })

  it('creates roughly 400 search logs', async () => {
    const count = await prisma.searchLog.count()
    expect(count).toBeGreaterThanOrEqual(350)
    expect(count).toBeLessThanOrEqual(450)
  })

  it('clusters about 30 zero-result searches on a few items for the unmet-demand report', async () => {
    const zero = await prisma.searchLog.count({ where: { resultCount: 0 } })
    expect(zero).toBeGreaterThanOrEqual(25)
    expect(zero).toBeLessThanOrEqual(40)

    const grouped = await prisma.searchLog.groupBy({
      by: ['queryText'], where: { resultCount: 0 }, _count: true,
      orderBy: { _count: { queryText: 'desc' } },
    })
    expect(grouped.length).toBeLessThanOrEqual(8) // clustered, not scattered
    expect(grouped[0]._count).toBeGreaterThan(3)  // a clear top request
  })
})
