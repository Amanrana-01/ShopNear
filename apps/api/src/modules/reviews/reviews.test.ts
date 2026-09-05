import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'

/**
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables. Distinct phone numbers in the 9166661xxx range
 * keep this file's fixtures isolated from other suites (orders.test.ts uses
 * 9166660xxx).
 */

const app = createApp()

const OWNER_PHONE = '9166661001'
const CUSTOMER_A_PHONE = '9166661011'
const CUSTOMER_B_PHONE = '9166661012'

let shopId: string
let productId: string
let customerAId: string
let customerAToken: string
let customerBToken: string
let ownerId: string

let orderCounter = 0

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

/** Creates an order directly at whatever status a test needs — reviews are tested independently of the state machine, which has its own suite. */
async function makeOrder(customerId: string, status: 'PLACED' | 'COMPLETED') {
  orderCounter += 1
  return prisma.order.create({
    data: {
      orderNumber: `SN-REV-${Date.now()}-${orderCounter}`,
      customerId,
      shopId,
      type: 'RESERVE_AND_COLLECT',
      status,
      subtotal: 50,
      total: 50,
      paymentMode: 'CASH_ON_PICKUP',
      paymentStatus: status === 'COMPLETED' ? 'PAID' : 'PENDING',
      pickupCode: '1234',
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
        await prisma.review.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    }
    await prisma.user.delete({ where: { id: owner.id } })
  }
  await prisma.user.deleteMany({ where: { phone: { in: [CUSTOMER_A_PHONE, CUSTOMER_B_PHONE] }, role: 'CUSTOMER' } })
  await prisma.product.deleteMany({ where: { name: 'Fixture Review Product' } })
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'reviews-fixture-cat' } } })
}

describe('reviews API', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    const category = await prisma.category.create({
      data: { name: 'Reviews Fixture Cat', nameGu: 'Reviews Fixture Cat', slug: `reviews-fixture-cat-${Date.now()}`, iconName: 'box' },
    })
    const product = await prisma.product.create({
      data: { name: 'Fixture Review Product', nameGu: 'Fixture Review Product', categoryId: category.id, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: ['fixture'] },
    })
    productId = product.id

    const owner = await prisma.user.create({
      data: { name: 'Review Fixture Owner', phone: OWNER_PHONE, role: 'MERCHANT', passwordHash: await argon2.hash('owner-pass') },
    })
    ownerId = owner.id
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Review Fixture Shop', nameGu: 'Review Fixture Shop', type: 'KIRANA',
        phone: '9166669998', address: 'Review Fixture Address', lat: 23.037, lng: 72.5615,
        status: 'ACTIVE', openingHours: OPEN_ALL_DAY,
      },
    })
    shopId = shop.id

    const custA = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_A_PHONE, otp: '123456' })
    customerAId = custA.body.user.id
    customerAToken = custA.body.accessToken
    const custB = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_B_PHONE, otp: '123456' })
    customerBToken = custB.body.accessToken
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('rejects a review on a non-COMPLETED order with 400', async () => {
    const order = await makeOrder(customerAId, 'PLACED')
    const res = await request(app)
      .post(`/api/orders/${order.id}/reviews`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ rating: 5, comment: 'Great!' })
    expect(res.status).toBe(400)
  })

  it('rejects a review from someone other than the order\'s own customer with 403', async () => {
    const order = await makeOrder(customerAId, 'COMPLETED')
    const res = await request(app)
      .post(`/api/orders/${order.id}/reviews`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ rating: 3 })
    expect(res.status).toBe(403)
  })

  it('accepts a review on a COMPLETED order and recomputes Shop.avgRating/ratingCount', async () => {
    const order = await makeOrder(customerAId, 'COMPLETED')
    const res = await request(app)
      .post(`/api/orders/${order.id}/reviews`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ rating: 4, comment: 'Good service.' })
    expect(res.status).toBe(201)
    expect(res.body.review.rating).toBe(4)

    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })
    expect(shop.ratingCount).toBeGreaterThanOrEqual(1)
    expect(shop.avgRating).toBeGreaterThan(0)

    const list = await request(app).get(`/api/shops/${shopId}/reviews`)
    expect(list.status).toBe(200)
    expect(list.body.reviews.some((r: { orderId: string }) => r.orderId === order.id)).toBe(true)
  })

  it('rejects a second review on the same order with 409', async () => {
    const order = await makeOrder(customerAId, 'COMPLETED')
    const first = await request(app)
      .post(`/api/orders/${order.id}/reviews`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ rating: 5 })
    expect(first.status).toBe(201)

    const second = await request(app)
      .post(`/api/orders/${order.id}/reviews`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ rating: 1 })
    expect(second.status).toBe(409)
  })

  it('recomputes the shop average across multiple reviews', async () => {
    const before = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })
    const countBefore = before.ratingCount

    const orderLow = await makeOrder(customerAId, 'COMPLETED')
    await request(app)
      .post(`/api/orders/${orderLow.id}/reviews`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ rating: 1 })

    const after = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })
    expect(after.ratingCount).toBe(countBefore + 1)

    const reviews = await prisma.review.findMany({ where: { shopId } })
    const expectedAvg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    expect(after.avgRating).toBeCloseTo(expectedAvg, 5)
  })
})
