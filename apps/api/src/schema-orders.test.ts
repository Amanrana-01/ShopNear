import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'
import {
  SHOP_TYPES,
  AVAILABILITY_STATES,
  ORDER_STATUSES,
  USER_ROLES,
} from '@shopnear/shared'
import {
  ShopType as PrismaShopType,
  Availability as PrismaAvailability,
  OrderStatus as PrismaOrderStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client'

async function fixture() {
  const owner = await prisma.user.create({
    data: { name: 'Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
  })
  const customer = await prisma.user.create({
    data: { name: 'Asha', phone: '9000000001', role: 'CUSTOMER' },
  })
  const shop = await prisma.shop.create({
    data: { ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
            type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
            lat: 23.0365, lng: 72.5611, status: 'ACTIVE', openingHours: {} },
  })
  const cat = await prisma.category.create({
    data: { name: 'Flours', nameGu: 'લોટ', slug: 'flours', iconName: 'wheat' },
  })
  const product = await prisma.product.create({
    data: { name: 'Aashirvaad Atta 5 kg', nameGu: 'આશીર્વાદ લોટ', categoryId: cat.id,
            unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 285,
            searchKeywords: ['atta', 'aata'] },
  })
  return { owner, customer, shop, product }
}

describe('order, review, dispute, and audit schema', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "SearchLog", "AvailabilityEvent", "Dispute", "Review", "OrderItem", "Order", "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates a reservation with a pickup code and an expiry', async () => {
    const { customer, shop, product } = await fixture()
    const order = await prisma.order.create({
      data: {
        orderNumber: 'SN-2401', customerId: customer.id, shopId: shop.id,
        type: 'RESERVE_AND_COLLECT', subtotal: 279, total: 279,
        paymentMode: 'CASH_ON_PICKUP', pickupCode: '4821',
        expiresAt: new Date('2026-09-05T12:00:00Z'),
        items: {
          create: [{
            productId: product.id, productNameSnapshot: 'Aashirvaad Atta 5 kg',
            unitLabelSnapshot: '5 kg', quantity: 1, unitPrice: 279, lineTotal: 279,
          }],
        },
      },
      include: { items: true },
    })
    expect(order.status).toBe('PLACED')
    expect(order.pickupCode).toBe('4821')
    expect(order.items).toHaveLength(1)
    expect(order.items[0].fulfilmentStatus).toBe('PENDING')
  })

  it('keeps item name and price snapshots independent of the live product', async () => {
    // Spec §4: historical orders must never join to live catalogue data.
    const { customer, shop, product } = await fixture()
    const order = await prisma.order.create({
      data: {
        orderNumber: 'SN-2402', customerId: customer.id, shopId: shop.id,
        type: 'RESERVE_AND_COLLECT', subtotal: 279, total: 279,
        paymentMode: 'CASH_ON_PICKUP', pickupCode: '1111',
        items: { create: [{
          productId: product.id, productNameSnapshot: 'Aashirvaad Atta 5 kg',
          unitLabelSnapshot: '5 kg', quantity: 1, unitPrice: 279, lineTotal: 279,
        }] },
      },
      include: { items: true },
    })
    await prisma.product.update({
      where: { id: product.id },
      data: { name: 'Aashirvaad Superior MP Atta 5 kg' },
    })
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
    expect(items[0].productNameSnapshot).toBe('Aashirvaad Atta 5 kg')
  })

  it('rejects a second order with the same order number', async () => {
    const { customer, shop } = await fixture()
    const base = {
      customerId: customer.id, shopId: shop.id, type: 'RESERVE_AND_COLLECT' as const,
      subtotal: 10, total: 10, paymentMode: 'CASH_ON_PICKUP' as const, pickupCode: '0000',
    }
    await prisma.order.create({ data: { ...base, orderNumber: 'SN-2403' } })
    await expect(
      prisma.order.create({ data: { ...base, orderNumber: 'SN-2403' } }),
    ).rejects.toThrow()
  })

  it('allows only one review per order', async () => {
    const { customer, shop } = await fixture()
    const order = await prisma.order.create({
      data: { orderNumber: 'SN-2404', customerId: customer.id, shopId: shop.id,
              type: 'RESERVE_AND_COLLECT', subtotal: 10, total: 10,
              paymentMode: 'CASH_ON_PICKUP', pickupCode: '0000', status: 'COMPLETED' },
    })
    await prisma.review.create({
      data: { orderId: order.id, customerId: customer.id, shopId: shop.id,
              rating: 5, comment: 'Fast confirm' },
    })
    await expect(
      prisma.review.create({
        data: { orderId: order.id, customerId: customer.id, shopId: shop.id, rating: 1 },
      }),
    ).rejects.toThrow()
  })

  it('records an availability event with both before and after states', async () => {
    const { shop, product } = await fixture()
    const event = await prisma.availabilityEvent.create({
      data: { shopId: shop.id, productId: product.id,
              previousAvailability: 'UNKNOWN', newAvailability: 'IN_STOCK',
              source: 'RESERVATION_CONFIRMED' },
    })
    expect(event.previousAvailability).toBe('UNKNOWN')
    expect(event.newAvailability).toBe('IN_STOCK')
  })

  it('logs a zero-result search with its location', async () => {
    const log = await prisma.searchLog.create({
      data: { queryText: 'oat milk', resultCount: 0, lat: 23.0365, lng: 72.5611 },
    })
    expect(log.resultCount).toBe(0)
    expect(log.userId).toBeNull()
  })

  it('opens a dispute against a completed order', async () => {
    const { customer, shop } = await fixture()
    const order = await prisma.order.create({
      data: { orderNumber: 'SN-2405', customerId: customer.id, shopId: shop.id,
              type: 'RESERVE_AND_COLLECT', subtotal: 10, total: 10,
              paymentMode: 'CASH_ON_PICKUP', pickupCode: '0000', status: 'COMPLETED' },
    })
    const dispute = await prisma.dispute.create({
      data: { orderId: order.id, raisedByUserId: customer.id,
              reason: 'ITEM_NOT_AVAILABLE_ON_ARRIVAL',
              description: 'Shop had run out when I arrived' },
    })
    expect(dispute.status).toBe('OPEN')
    expect(dispute.resolvedAt).toBeNull()
  })

  it('keeps packages/shared enum arrays in step with the Prisma-generated enums', () => {
    // These arrays are imported by the API and all three web clients in later
    // phases. Silent drift between them and the database would surface as
    // runtime bugs far from their cause, so compare as sets (order-independent).
    expect(new Set(SHOP_TYPES)).toEqual(new Set(Object.values(PrismaShopType)))
    expect(new Set(AVAILABILITY_STATES)).toEqual(new Set(Object.values(PrismaAvailability)))
    expect(new Set(ORDER_STATUSES)).toEqual(new Set(Object.values(PrismaOrderStatus)))
    expect(new Set(USER_ROLES)).toEqual(new Set(Object.values(PrismaUserRole)))
  })
})
