import type { PrismaClient } from '@prisma/client'
import type { Rng } from './random'
import { SEED_NOW } from './clock'

/** Items people asked for that nobody nearby stocks — the unmet-demand story. */
const ZERO_RESULT_QUERIES = [
  'oat milk', 'gluten free bread', 'kombucha', 'quinoa', 'almond butter', 'tofu',
]

const COMMON_QUERIES = [
  'atta', 'aata', 'doodh', 'milk', 'maggi', 'sabun', 'colgate', 'butter',
  'toor dal', 'chawal', 'rice', 'sugar', 'chai', 'biscuit', 'namkeen',
]

const REVIEW_COMMENTS = [
  'Confirmed in under a minute, item was ready.',
  'Good price, friendly shopkeeper.',
  'Had to wait a bit but item was there.',
  'Exactly as listed on the app.',
  null,
]

export async function seedHistory(
  prisma: PrismaClient,
  rng: Rng,
  ctx: {
    shopIds: string[]
    customerIds: string[]
    defaultCustomerAddress: { lat: number; lng: number }
  },
) {
  // Only ACTIVE shops have trading history — pending and suspended shops
  // should look genuinely new/idle in the admin panel.
  // Ordered by name (content, not id/creation time) so the array position
  // that rng.pick indexes into is identical on every deterministic run —
  // Postgres does not guarantee row order without ORDER BY.
  const activeShops = await prisma.shop.findMany({
    where: { status: 'ACTIVE' }, select: { id: true }, orderBy: { name: 'asc' },
  })
  const shopIds = activeShops.map((s) => s.id)

  const ORDER_COUNT = 120
  const orderIds: string[] = []
  let orderNumber = 2401

  for (let i = 0; i < ORDER_COUNT; i++) {
    const shopId = rng.pick(shopIds)
    const customerId = rng.pick(ctx.customerIds)
    const createdAt = new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000)

    // Weighted toward completion so the platform looks healthy, while still
    // populating every terminal state for the analytics charts.
    const status = rng.pick([
      'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
      'REJECTED_BY_SHOP', 'EXPIRED', 'CANCELLED_BY_CUSTOMER',
    ] as const)

    // Ordered by product name (content, not id/creation time) for the same
    // determinism reason as above — `take` + rng.sample both depend on a
    // stable row order across runs.
    const inventory = await prisma.shopInventory.findMany({
      where: { shopId }, take: 40, include: { product: true },
      orderBy: { product: { name: 'asc' } },
    })
    if (inventory.length === 0) continue
    const lines = rng.sample(inventory, rng.int(1, 4))

    let subtotal = 0
    const items = lines.map((inv) => {
      const quantity = rng.int(1, 3)
      const lineTotal = Number((inv.price * quantity).toFixed(2))
      subtotal += lineTotal
      return {
        productId: inv.productId,
        productNameSnapshot: inv.product.name,
        unitLabelSnapshot: inv.product.defaultUnitLabel,
        quantity, unitPrice: inv.price, lineTotal,
        fulfilmentStatus:
          status === 'COMPLETED' ? ('AVAILABLE' as const)
          : status === 'REJECTED_BY_SHOP' ? ('UNAVAILABLE' as const)
          : ('PENDING' as const),
      }
    })
    subtotal = Number(subtotal.toFixed(2))

    const confirmedAt = status === 'COMPLETED'
      ? new Date(createdAt.getTime() + rng.int(1, 12) * 60_000) : null

    const order = await prisma.order.create({
      data: {
        orderNumber: `SN-${orderNumber++}`, customerId, shopId,
        type: 'RESERVE_AND_COLLECT', status,
        subtotal, deliveryFee: 0, total: subtotal,
        paymentMode: 'CASH_ON_PICKUP',
        paymentStatus: status === 'COMPLETED' ? 'PAID' : 'PENDING',
        pickupCode: String(rng.int(1000, 9999)),
        expiresAt: new Date(createdAt.getTime() + 2 * 60 * 60_000),
        createdAt,
        confirmedAt,
        readyAt: confirmedAt,
        completedAt: status === 'COMPLETED'
          ? new Date(createdAt.getTime() + rng.int(20, 180) * 60_000) : null,
        rejectedAt: status === 'REJECTED_BY_SHOP'
          ? new Date(createdAt.getTime() + rng.int(1, 20) * 60_000) : null,
        rejectionReason: status === 'REJECTED_BY_SHOP'
          ? rng.pick(['Item finished today', 'Shop closing early', 'Stock not arrived']) : null,
        cancelledAt: status === 'CANCELLED_BY_CUSTOMER'
          ? new Date(createdAt.getTime() + rng.int(1, 60) * 60_000) : null,
        expiredAt: status === 'EXPIRED'
          ? new Date(createdAt.getTime() + 2 * 60 * 60_000) : null,
        items: { create: items },
      },
    })
    orderIds.push(order.id)

    // Every resolved reservation teaches us something about availability —
    // this is what the confidence model and accuracy analytics feed on.
    for (const line of items) {
      if (line.fulfilmentStatus === 'PENDING') continue
      const confirmedLine = line.fulfilmentStatus === 'AVAILABLE'
      await prisma.availabilityEvent.create({
        data: {
          shopId, productId: line.productId,
          previousAvailability: 'UNKNOWN',
          newAvailability: confirmedLine ? 'IN_STOCK' : 'OUT_OF_STOCK',
          source: confirmedLine ? 'RESERVATION_CONFIRMED' : 'RESERVATION_REJECTED',
          orderId: order.id,
          createdAt: confirmedAt ?? createdAt,
        },
      })
    }
  }

  // Reviews — only on completed orders, skewed positive but not uniform.
  // Ordered by orderNumber (a deterministic loop counter, not id/creation
  // time) so rng.sample picks the same subset on every run.
  const completed = await prisma.order.findMany({
    where: { status: 'COMPLETED' }, select: { id: true, customerId: true, shopId: true, completedAt: true },
    orderBy: { orderNumber: 'asc' },
  })
  for (const order of rng.sample(completed, Math.min(60, completed.length))) {
    await prisma.review.create({
      data: {
        orderId: order.id, customerId: order.customerId, shopId: order.shopId,
        rating: rng.pick([5, 5, 5, 4, 4, 4, 3, 2]),
        comment: rng.pick(REVIEW_COMMENTS),
        createdAt: order.completedAt ?? SEED_NOW,
      },
    })
  }

  // Denormalised rating on Shop, so shop cards need no aggregate query.
  for (const shopId of shopIds) {
    const agg = await prisma.review.aggregate({
      where: { shopId }, _avg: { rating: true }, _count: true,
    })
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        avgRating: Number((agg._avg.rating ?? 0).toFixed(2)),
        ratingCount: agg._count,
      },
    })
  }

  // Two open disputes so the admin queue is never empty.
  const disputeOrders = rng.sample(completed, 2)
  for (const order of disputeOrders) {
    await prisma.dispute.create({
      data: {
        orderId: order.id, raisedByUserId: order.customerId,
        reason: rng.pick(['ITEM_NOT_AVAILABLE_ON_ARRIVAL', 'PRICE_MISMATCH'] as const),
        description: 'Shop did not have the item when I reached, despite the confirmation.',
        status: 'OPEN',
        createdAt: new Date(SEED_NOW.getTime() - rng.int(60, 5000) * 60_000),
      },
    })
  }

  // Search logs, including a tight cluster of zero-result queries.
  for (let i = 0; i < 370; i++) {
    const queryText = rng.pick(COMMON_QUERIES)
    await prisma.searchLog.create({
      data: {
        userId: rng.bool(0.7) ? rng.pick(ctx.customerIds) : null,
        queryText, resultCount: rng.int(1, 12),
        lat: ctx.defaultCustomerAddress.lat, lng: ctx.defaultCustomerAddress.lng,
        createdAt: new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000),
      },
    })
  }
  for (let i = 0; i < 30; i++) {
    await prisma.searchLog.create({
      data: {
        userId: rng.bool(0.7) ? rng.pick(ctx.customerIds) : null,
        queryText: rng.pick(ZERO_RESULT_QUERIES), resultCount: 0,
        lat: ctx.defaultCustomerAddress.lat, lng: ctx.defaultCustomerAddress.lng,
        createdAt: new Date(SEED_NOW.getTime() - rng.int(0, 30 * 24 * 60) * 60_000),
      },
    })
  }

  return { orderIds }
}
