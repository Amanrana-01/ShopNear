import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import argon2 from 'argon2'
import { prisma } from '../db'
import * as clock from '../clock/clock'
import { runExpiryJob } from './expiry.job'

/**
 * Expiry only ever touches `PLACED` orders whose `expiresAt` has passed
 * (spec §6) — never a `PLACED` order still within its window, and never any
 * other status regardless of how old its `expiresAt` is (the shop already
 * acted on those).
 *
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables.
 */

const OWNER_PHONE = '9166664001'
const CUSTOMER_PHONE = '9166664011'

let shopId: string
let productId: string
let customerId: string
let orderCounter = 0

async function makeOrder(status: 'PLACED' | 'CONFIRMED' | 'COMPLETED', expiresAtOffsetHours: number) {
  orderCounter += 1
  const expiresAt = new Date(clock.now().getTime() + expiresAtOffsetHours * 60 * 60 * 1000)
  return prisma.order.create({
    data: {
      orderNumber: `SN-EXP-${Date.now()}-${orderCounter}`,
      customerId,
      shopId,
      type: 'RESERVE_AND_COLLECT',
      status,
      subtotal: 50,
      total: 50,
      paymentMode: 'CASH_ON_PICKUP',
      paymentStatus: status === 'COMPLETED' ? 'PAID' : 'PENDING',
      pickupCode: '1234',
      expiresAt,
      confirmedAt: status !== 'PLACED' ? clock.now() : null,
      completedAt: status === 'COMPLETED' ? clock.now() : null,
      items: {
        create: [{ productId, productNameSnapshot: 'Fixture Product', unitLabelSnapshot: '1 unit', quantity: 1, unitPrice: 50, lineTotal: 50 }],
      },
    },
  })
}

async function cleanup() {
  const owner = await prisma.user.findUnique({ where: { phone_role: { phone: OWNER_PHONE, role: 'MERCHANT' } } })
  if (owner) {
    const shops = await prisma.shop.findMany({ where: { ownerId: owner.id }, select: { id: true } })
    const shopIds = shops.map((s) => s.id)
    if (shopIds.length > 0) {
      const orders = await prisma.order.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } })
      const orderIds = orders.map((o) => o.id)
      if (orderIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    }
    await prisma.user.delete({ where: { id: owner.id } })
  }
  await prisma.user.deleteMany({ where: { phone: CUSTOMER_PHONE, role: 'CUSTOMER' } })
  await prisma.product.deleteMany({ where: { name: 'Fixture Expiry Product' } })
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'expiry-fixture-cat' } } })
}

describe('runExpiryJob', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    const category = await prisma.category.create({
      data: { name: 'Expiry Fixture Cat', nameGu: 'Expiry Fixture Cat', slug: `expiry-fixture-cat-${Date.now()}`, iconName: 'box' },
    })
    const product = await prisma.product.create({
      data: { name: 'Fixture Expiry Product', nameGu: 'Fixture Expiry Product', categoryId: category.id, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: ['fixture'] },
    })
    productId = product.id

    const owner = await prisma.user.create({
      data: { name: 'Expiry Fixture Owner', phone: OWNER_PHONE, role: 'MERCHANT', passwordHash: await argon2.hash('owner-pass') },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Expiry Fixture Shop', nameGu: 'Expiry Fixture Shop', type: 'KIRANA',
        phone: '9166669995', address: 'Expiry Fixture Address', lat: 23.037, lng: 72.5615,
        status: 'ACTIVE',
        openingHours: {
          mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
          wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
          fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
          sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
        },
      },
    })
    shopId = shop.id

    const custRow = await prisma.user.create({ data: { name: 'Expiry Fixture Customer', phone: CUSTOMER_PHONE, role: 'CUSTOMER' } })
    customerId = custRow.id
  })

  afterAll(async () => {
    await cleanup()
    await clock.reset()
    await prisma.$disconnect()
  })

  it('expires a PLACED order whose expiresAt is in the past, and leaves everything else alone', async () => {
    const expiredPlaced = await makeOrder('PLACED', -1) // expired 1h ago
    const stillPendingPlaced = await makeOrder('PLACED', 5) // still 5h to go
    const staleConfirmed = await makeOrder('CONFIRMED', -10) // stale expiresAt, but already acted on
    const staleCompleted = await makeOrder('COMPLETED', -10)

    const result = await runExpiryJob()
    expect(result.expiredCount).toBeGreaterThanOrEqual(1)

    const expired = await prisma.order.findUniqueOrThrow({ where: { id: expiredPlaced.id } })
    expect(expired.status).toBe('EXPIRED')
    expect(expired.expiredAt).toBeTruthy()

    const stillPending = await prisma.order.findUniqueOrThrow({ where: { id: stillPendingPlaced.id } })
    expect(stillPending.status).toBe('PLACED')

    const confirmed = await prisma.order.findUniqueOrThrow({ where: { id: staleConfirmed.id } })
    expect(confirmed.status).toBe('CONFIRMED')

    const completed = await prisma.order.findUniqueOrThrow({ where: { id: staleCompleted.id } })
    expect(completed.status).toBe('COMPLETED')
  })

  it('is idempotent — running it again does nothing new', async () => {
    const first = await runExpiryJob()
    const second = await runExpiryJob()
    expect(second.expiredCount).toBe(0)
    expect(first.expiredCount).toBeGreaterThanOrEqual(0)
  })
})
