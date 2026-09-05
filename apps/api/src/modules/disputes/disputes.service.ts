import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { forbidden, notFound } from '../../http/errors'
import type { CreateDisputeInput, ResolveDisputeInput } from './disputes.schemas'

/**
 * Disputes (spec §4 `Dispute` model): a customer raises one against their
 * own order; an admin lists and resolves them. Unlike reviews, disputes are
 * not restricted to `COMPLETED` orders — "the shop was closed" or "price
 * mismatch" can be raised about any order the customer actually placed, and
 * more than one dispute may exist per order over time.
 */
export async function createDispute(customerId: string, orderId: string, input: CreateDisputeInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw notFound('Order not found.')

  if (order.customerId !== customerId) {
    throw forbidden('You can only raise a dispute on your own order.')
  }

  return prisma.dispute.create({
    data: {
      orderId,
      raisedByUserId: customerId,
      reason: input.reason,
      description: input.description,
      createdAt: clock.now(),
    },
  })
}

export async function listDisputes(status?: 'OPEN' | 'RESOLVED' | 'REJECTED') {
  return prisma.dispute.findMany({
    where: status ? { status } : undefined,
    include: { order: true },
    orderBy: { createdAt: 'desc' },
  })
}

/** Admin-only (enforced at the route). Resolving stamps `resolvedAt` from the virtual clock, never real time. */
export async function resolveDispute(disputeId: string, input: ResolveDisputeInput) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } })
  if (!dispute) throw notFound('Dispute not found.')

  return prisma.dispute.update({
    where: { id: disputeId },
    data: { status: input.status, adminNote: input.adminNote, resolvedAt: clock.now() },
  })
}
