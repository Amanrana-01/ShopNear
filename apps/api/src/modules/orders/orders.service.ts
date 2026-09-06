import type { Availability, AvailabilitySource, FulfilmentStatus, OrderType, Prisma } from '@prisma/client'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { badRequest, conflict, forbidden, notFound } from '../../http/errors'
import { RESERVATION_EXPIRY_HOURS } from '../../config/constants'
import { emitOrderNew, emitOrderUpdated } from '../../realtime/io'
import { assertTransition } from './stateMachine'
import type { CreateOrderInput, ConfirmOrderInput } from './orders.schemas'

type Tx = Prisma.TransactionClient

/**
 * Sequential, human-readable order numbers (spec: `SN-####`) shared with the
 * seed's own `SN-2401..` range. Reads the current maximum via a cast rather
 * than lexicographic `MAX(orderNumber)` (which would sort "SN-999" ahead of
 * "SN-1000") so it stays correct regardless of digit count.
 */
async function nextOrderNumber(tx: Tx): Promise<string> {
  const rows = await tx.$queryRaw<{ maxnum: number | null }[]>`
    SELECT MAX(CAST(substring("orderNumber" from 4) AS INTEGER)) AS maxnum
    FROM "Order" WHERE "orderNumber" ~ '^SN-[0-9]+$'
  `
  const next = (rows[0]?.maxnum ?? 3000) + 1
  return `SN-${next}`
}

function generatePickupCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * Creates a reservation/delivery order (spec §6). Orders may only be placed
 * at an `ACTIVE` shop — a shop still `PENDING` approval, or `SUSPENDED`,
 * must reject with 409 rather than silently accepting orders it can never
 * fulfil.
 */
export async function createOrder(customerId: string, input: CreateOrderInput) {
  const shop = await prisma.shop.findUnique({ where: { id: input.shopId } })
  if (!shop) throw notFound('Shop not found.')
  if (shop.status !== 'ACTIVE') {
    throw conflict('This shop is not currently accepting orders.')
  }

  const productIds = input.items.map((i) => i.productId)
  const inventoryRows = await prisma.shopInventory.findMany({
    where: { shopId: input.shopId, productId: { in: productIds }, isActive: true },
    include: { product: true },
  })
  const byProductId = new Map(inventoryRows.map((row) => [row.productId, row]))

  const missing = productIds.filter((id) => !byProductId.has(id))
  if (missing.length > 0) {
    throw badRequest('One or more items are not sold by this shop.', { missingProductIds: missing })
  }

  let subtotal = 0
  const itemsData = input.items.map((item) => {
    const inv = byProductId.get(item.productId)!
    const lineTotal = Number((inv.price * item.quantity).toFixed(2))
    subtotal += lineTotal
    return {
      productId: item.productId,
      productNameSnapshot: inv.product.name,
      unitLabelSnapshot: inv.product.defaultUnitLabel,
      quantity: item.quantity,
      unitPrice: inv.price,
      lineTotal,
      fulfilmentStatus: 'PENDING' as const,
    }
  })
  subtotal = Number(subtotal.toFixed(2))
  const deliveryFee = input.type === 'DELIVERY' ? shop.deliveryFee : 0
  const total = Number((subtotal + deliveryFee).toFixed(2))

  const now = clock.now()
  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx)
    return tx.order.create({
      data: {
        orderNumber,
        customerId,
        shopId: input.shopId,
        type: input.type,
        status: 'PLACED',
        subtotal,
        deliveryFee,
        total,
        paymentMode: input.paymentMode,
        deliveryAddressId: input.deliveryAddressId,
        customerNote: input.customerNote,
        pickupCode: generatePickupCode(),
        expiresAt: new Date(now.getTime() + RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000),
        createdAt: now,
        items: { create: itemsData },
      },
      include: { items: true },
    })
  })

  // Spec §9/§12: the shop's incoming-order screen must light up the moment
  // a reservation lands, without a refresh.
  emitOrderNew(order.shopId, order)

  return order
}

async function loadOrderOrThrow(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shop: true },
  })
  if (!order) throw notFound('Order not found.')
  return order
}

export async function getOrder(orderId: string, requester: { sub: string; role: string }) {
  const order = await loadOrderOrThrow(orderId)
  assertCanView(order, requester)
  return order
}

function assertCanView(
  order: { customerId: string; shop: { ownerId: string } },
  requester: { sub: string; role: string },
): void {
  if (requester.role === 'ADMIN') return
  if (requester.role === 'CUSTOMER' && order.customerId === requester.sub) return
  if (requester.role === 'MERCHANT' && order.shop.ownerId === requester.sub) return
  throw forbidden('You do not have access to this order.')
}

export async function listCustomerOrders(customerId: string) {
  return prisma.order.findMany({ where: { customerId }, include: { items: true }, orderBy: { createdAt: 'desc' } })
}

export async function listShopOrders(shopId: string) {
  return prisma.order.findMany({ where: { shopId }, include: { items: true }, orderBy: { createdAt: 'desc' } })
}

const AVAILABLE_SOURCE: AvailabilitySource = 'RESERVATION_CONFIRMED'
const UNAVAILABLE_SOURCE: AvailabilitySource = 'RESERVATION_REJECTED'

/**
 * Writes one `AvailabilityEvent` and updates the matching `ShopInventory`
 * row — this is how every reservation outcome feeds the confidence model
 * (spec §6/§7), not just bookkeeping. Creates the inventory row if the
 * product somehow has none yet, so this can never silently no-op.
 */
async function recordAvailabilityOutcome(
  tx: Tx,
  shopId: string,
  productId: string,
  outcome: 'AVAILABLE' | 'UNAVAILABLE',
  now: Date,
  orderId: string,
) {
  const newAvailability: Availability = outcome === 'AVAILABLE' ? 'IN_STOCK' : 'OUT_OF_STOCK'
  const source: AvailabilitySource = outcome === 'AVAILABLE' ? AVAILABLE_SOURCE : UNAVAILABLE_SOURCE

  const existing = await tx.shopInventory.findUnique({ where: { shopId_productId: { shopId, productId } } })
  const previousAvailability: Availability = existing?.availability ?? 'UNKNOWN'

  await tx.shopInventory.upsert({
    where: { shopId_productId: { shopId, productId } },
    create: {
      shopId,
      productId,
      price: existing?.price ?? 0,
      availability: newAvailability,
      availabilityUpdatedAt: now,
      availabilitySource: source,
      confirmCount: outcome === 'AVAILABLE' ? 1 : 0,
      rejectCount: outcome === 'UNAVAILABLE' ? 1 : 0,
    },
    update: {
      availability: newAvailability,
      availabilityUpdatedAt: now,
      availabilitySource: source,
      ...(outcome === 'AVAILABLE' ? { confirmCount: { increment: 1 } } : { rejectCount: { increment: 1 } }),
    },
  })

  await tx.availabilityEvent.create({
    data: { shopId, productId, previousAvailability, newAvailability, source, orderId },
  })
}

/**
 * The merchant's one-tap confirm (spec §9, §6): resolves every line item as
 * `AVAILABLE` / `UNAVAILABLE` / `SUBSTITUTED`, then either confirms the
 * order (recalculating the total from what's actually available) or, if
 * every item is unavailable, rejects it outright. For `RESERVE_AND_COLLECT`
 * a successful confirm auto-advances straight to `READY_FOR_PICKUP` (spec
 * R4) — there is no separate packing step.
 */
export async function confirmOrder(orderId: string, input: ConfirmOrderInput) {
  const order = await loadOrderOrThrow(orderId)

  // Route illegal-status attempts through the state machine so the error is
  // consistent with every other transition, regardless of which branch
  // (CONFIRMED vs REJECTED_BY_SHOP) this call ultimately takes.
  if (order.status !== 'PLACED') {
    assertTransition(order.status, 'CONFIRMED', order.type)
  }

  const itemIds = new Set(order.items.map((i) => i.id))
  const resolvedIds = new Set(input.items.map((i) => i.orderItemId))
  if (itemIds.size !== resolvedIds.size || [...itemIds].some((id) => !resolvedIds.has(id))) {
    throw badRequest('Every line item must be resolved (AVAILABLE, UNAVAILABLE, or SUBSTITUTED).')
  }

  const now = clock.now()
  const allUnavailable = input.items.every((i) => i.fulfilmentStatus === 'UNAVAILABLE')

  const updated = await prisma.$transaction(async (tx) => {
    let recalculatedSubtotal = 0

    for (const resolution of input.items) {
      const item = order.items.find((i) => i.id === resolution.orderItemId)!

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          fulfilmentStatus: resolution.fulfilmentStatus,
          substituteProductId: resolution.substituteProductId,
        },
      })

      if (resolution.fulfilmentStatus === 'AVAILABLE') {
        await recordAvailabilityOutcome(tx, order.shopId, item.productId, 'AVAILABLE', now, order.id)
        recalculatedSubtotal += item.lineTotal
      } else if (resolution.fulfilmentStatus === 'UNAVAILABLE') {
        await recordAvailabilityOutcome(tx, order.shopId, item.productId, 'UNAVAILABLE', now, order.id)
      } else {
        // SUBSTITUTED: the original product wasn't available (same negative
        // signal as UNAVAILABLE for it), but the customer still gets
        // something — priced from the substitute's own inventory row when
        // we can find one, otherwise the original line's price stands.
        await recordAvailabilityOutcome(tx, order.shopId, item.productId, 'UNAVAILABLE', now, order.id)
        let lineTotal = item.lineTotal
        if (resolution.substituteProductId) {
          const subInventory = await tx.shopInventory.findUnique({
            where: { shopId_productId: { shopId: order.shopId, productId: resolution.substituteProductId } },
          })
          if (subInventory) {
            lineTotal = Number((subInventory.price * item.quantity).toFixed(2))
            await recordAvailabilityOutcome(tx, order.shopId, resolution.substituteProductId, 'AVAILABLE', now, order.id)
          }
        }
        recalculatedSubtotal += lineTotal
      }
    }

    if (allUnavailable) {
      assertTransition(order.status, 'REJECTED_BY_SHOP', order.type)
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'REJECTED_BY_SHOP', rejectedAt: now, rejectionReason: 'None of the items were available.' },
        include: { items: true },
      })
    }

    assertTransition(order.status, 'CONFIRMED', order.type)
    recalculatedSubtotal = Number(recalculatedSubtotal.toFixed(2))
    const total = Number((recalculatedSubtotal + order.deliveryFee).toFixed(2))

    if (order.type === 'RESERVE_AND_COLLECT') {
      // Auto-advance (spec R4): the merchant's single confirm tap covers
      // both CONFIRMED and READY_FOR_PICKUP for a pickup order.
      assertTransition('CONFIRMED', 'READY_FOR_PICKUP', order.type)
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: 'READY_FOR_PICKUP',
          subtotal: recalculatedSubtotal,
          total,
          confirmedAt: now,
          readyAt: now,
        },
        include: { items: true },
      })
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED', subtotal: recalculatedSubtotal, total, confirmedAt: now },
      include: { items: true },
    })
  })

  // Spec §9/§12: whatever branch this landed in (rejected outright,
  // confirmed, or auto-advanced to READY_FOR_PICKUP), the customer's
  // tracking screen must update live.
  emitOrderUpdated(updated.id, updated)

  return updated
}

/** Explicit merchant rejection of a still-unresolved order (spec §6). */
export async function rejectOrder(orderId: string, reason: string) {
  const order = await loadOrderOrThrow(orderId)
  assertTransition(order.status, 'REJECTED_BY_SHOP', order.type)

  const now = clock.now()
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'REJECTED_BY_SHOP', rejectedAt: now, rejectionReason: reason },
    include: { items: true },
  })
  emitOrderUpdated(updated.id, updated)
  return updated
}

/** Merchant marks a DELIVERY order as out with the delivery person. */
export async function markOutForDelivery(orderId: string) {
  const order = await loadOrderOrThrow(orderId)
  assertTransition(order.status, 'OUT_FOR_DELIVERY', order.type)

  const now = clock.now()
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'OUT_FOR_DELIVERY', outForDeliveryAt: now },
    include: { items: true },
  })
  emitOrderUpdated(updated.id, updated)
  return updated
}

/**
 * Completes the order. For a pickup order this requires the customer's
 * 4-digit `pickupCode` — a wrong code returns 400 and leaves the order
 * completely untouched (the legality check and the code check both happen
 * before any write).
 */
export async function completeOrder(orderId: string, pickupCode?: string) {
  const order = await loadOrderOrThrow(orderId)
  assertTransition(order.status, 'COMPLETED', order.type)

  if (order.type === 'RESERVE_AND_COLLECT' && pickupCode !== order.pickupCode) {
    throw badRequest('Incorrect pickup code.')
  }

  const now = clock.now()
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'COMPLETED', completedAt: now, paymentStatus: 'PAID' },
    include: { items: true },
  })
  emitOrderUpdated(updated.id, updated)
  return updated
}

/** Customer-initiated cancellation — ownership checked independently of role. */
export async function cancelOrder(orderId: string, customerId: string) {
  const order = await loadOrderOrThrow(orderId)
  if (order.customerId !== customerId) {
    throw forbidden('You do not own this order.')
  }
  assertTransition(order.status, 'CANCELLED_BY_CUSTOMER', order.type)

  const now = clock.now()
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED_BY_CUSTOMER', cancelledAt: now },
    include: { items: true },
  })
  emitOrderUpdated(updated.id, updated)
  return updated
}

export type { FulfilmentStatus, OrderType }
