import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { badRequest, conflict, forbidden, notFound } from '../../http/errors'
import type { CreateReviewInput } from './reviews.schemas'

/**
 * Reviews (spec §4 `Review` model): exactly one per order, and only once the
 * order has actually been `COMPLETED` — you cannot review a reservation you
 * never collected. Ownership is the order's own customer, always, never the
 * shop or an admin acting on their behalf.
 */
export async function createReview(customerId: string, orderId: string, input: CreateReviewInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw notFound('Order not found.')

  if (order.customerId !== customerId) {
    throw forbidden('You can only review your own order.')
  }

  if (order.status !== 'COMPLETED') {
    throw badRequest('Only a completed order can be reviewed.')
  }

  const existing = await prisma.review.findUnique({ where: { orderId } })
  if (existing) {
    throw conflict('This order has already been reviewed.')
  }

  const now = clock.now()

  // Recomputing avgRating/ratingCount from the review table itself (rather
  // than an incremental running average) keeps the shop's rating always
  // exactly consistent with its reviews, at the cost of one extra query —
  // negligible next to a one-review-per-order write.
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { orderId, customerId, shopId: order.shopId, rating: input.rating, comment: input.comment, createdAt: now },
    })

    const aggregate = await tx.review.aggregate({
      where: { shopId: order.shopId },
      _avg: { rating: true },
      _count: true,
    })

    await tx.shop.update({
      where: { id: order.shopId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        ratingCount: aggregate._count,
      },
    })

    return created
  })

  return review
}

export async function listShopReviews(shopId: string) {
  return prisma.review.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } })
}
