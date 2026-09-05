import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'

/**
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables. Distinct phone numbers in the 9166xxxxxx range
 * keep this file's fixtures isolated from other suites.
 */

const app = createApp()

const OWNER_A_PHONE = '9166660001'
const OWNER_B_PHONE = '9166660002'
const PENDING_OWNER_PHONE = '9166660003'
const CUSTOMER_A_PHONE = '9166660011'
const CUSTOMER_B_PHONE = '9166660012'

let categoryId: string
let shopA: { id: string; ownerId: string }
let shopB: { id: string; ownerId: string }
let pendingShop: { id: string }
let productAvailable1: string
let productAvailable2: string
let productUnavailable: string
let customerAId: string
let customerAToken: string
let customerBId: string
let customerBToken: string
let ownerAToken: string
let ownerBToken: string

async function makeOwner(phone: string, password: string) {
  return prisma.user.create({
    data: { name: 'Order Fixture Owner', phone, role: 'MERCHANT', passwordHash: await argon2.hash(password) },
  })
}

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

async function makeShop(ownerId: string, name: string, status: 'PENDING' | 'ACTIVE' = 'ACTIVE') {
  return prisma.shop.create({
    data: {
      ownerId, name, nameGu: name, type: 'KIRANA', phone: '9166669999',
      address: 'Order Fixture Address', lat: 23.037, lng: 72.5615,
      status, openingHours: OPEN_ALL_DAY, acceptsDelivery: true, deliveryFee: 20,
    },
  })
}

async function cleanup() {
  const owners = await prisma.user.findMany({
    where: { phone: { in: [OWNER_A_PHONE, OWNER_B_PHONE, PENDING_OWNER_PHONE] } },
    select: { id: true },
  })
  const ownerIds = owners.map((o) => o.id)
  const shops = await prisma.shop.findMany({ where: { ownerId: { in: ownerIds } }, select: { id: true } })
  const shopIds = shops.map((s) => s.id)

  if (shopIds.length > 0) {
    const orders = await prisma.order.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } })
    const orderIds = orders.map((o) => o.id)
    if (orderIds.length > 0) {
      await prisma.review.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.dispute.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    }
    await prisma.availabilityEvent.deleteMany({ where: { shopId: { in: shopIds } } })
    await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
    await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
  }
  await prisma.user.deleteMany({ where: { id: { in: ownerIds } } })
  await prisma.user.deleteMany({
    where: { phone: { in: [CUSTOMER_A_PHONE, CUSTOMER_B_PHONE] }, role: 'CUSTOMER' },
  })
  if (categoryId) {
    await prisma.product.deleteMany({ where: { categoryId } })
    await prisma.category.deleteMany({ where: { id: categoryId } })
  }
}

describe('orders API', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    categoryId = (
      await prisma.category.create({
        data: { name: 'Orders Fixture Cat', nameGu: 'Orders Fixture Cat', slug: `orders-fixture-cat-${Date.now()}`, iconName: 'box' },
      })
    ).id

    const [p1, p2, p3] = await Promise.all(
      ['Fixture Rice 1kg', 'Fixture Dal 1kg', 'Fixture Oil 1L'].map((name) =>
        prisma.product.create({
          data: { name, nameGu: name, categoryId, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: [name.toLowerCase()] },
        }),
      ),
    )
    productAvailable1 = p1.id
    productAvailable2 = p2.id
    productUnavailable = p3.id

    const ownerA = await makeOwner(OWNER_A_PHONE, 'owner-a-pass')
    const ownerB = await makeOwner(OWNER_B_PHONE, 'owner-b-pass')
    const pendingOwner = await makeOwner(PENDING_OWNER_PHONE, 'pending-owner-pass')

    shopA = await makeShop(ownerA.id, 'Order Fixture Shop A')
    shopB = await makeShop(ownerB.id, 'Order Fixture Shop B')
    pendingShop = await makeShop(pendingOwner.id, 'Order Fixture Pending Shop', 'PENDING')

    for (const productId of [productAvailable1, productAvailable2, productUnavailable]) {
      await prisma.shopInventory.create({
        data: { shopId: shopA.id, productId, price: 50, availability: 'UNKNOWN' },
      })
    }
    await prisma.shopInventory.create({
      data: { shopId: shopB.id, productId: productAvailable1, price: 55, availability: 'UNKNOWN' },
    })

    const loginA = await request(app).post('/api/auth/merchant/login').send({ phone: OWNER_A_PHONE, password: 'owner-a-pass' })
    ownerAToken = loginA.body.accessToken
    const loginB = await request(app).post('/api/auth/merchant/login').send({ phone: OWNER_B_PHONE, password: 'owner-b-pass' })
    ownerBToken = loginB.body.accessToken

    const custA = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_A_PHONE, otp: '123456' })
    customerAId = custA.body.user.id
    customerAToken = custA.body.accessToken
    const custB = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_B_PHONE, otp: '123456' })
    customerBId = custB.body.user.id
    customerBToken = custB.body.accessToken
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('rejects placing an order at a PENDING shop with 409', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        shopId: pendingShop.id, type: 'RESERVE_AND_COLLECT',
        items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
      })
    expect(res.status).toBe(409)
  })

  it('a CUSTOMER token cannot hit a merchant-only order route (403, not redirect)', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
        items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
      })
    const res = await request(app)
      .post(`/api/orders/${created.body.order.id}/confirm`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ items: [{ orderItemId: created.body.order.items[0].id, fulfilmentStatus: 'AVAILABLE' }] })
    expect(res.status).toBe(403)
  })

  describe('happy path: RESERVE_AND_COLLECT, all items available', () => {
    let orderId: string
    let itemIds: string[]

    it('creates a PLACED order with an expiry and a pickup code', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [
            { productId: productAvailable1, quantity: 2 },
            { productId: productAvailable2, quantity: 1 },
          ],
          paymentMode: 'CASH_ON_PICKUP',
        })
      expect(res.status).toBe(201)
      expect(res.body.order.status).toBe('PLACED')
      expect(res.body.order.pickupCode).toMatch(/^\d{4}$/)
      expect(res.body.order.expiresAt).toBeTruthy()
      expect(res.body.order.subtotal).toBe(150) // 2*50 + 1*50
      orderId = res.body.order.id
      itemIds = res.body.order.items.map((i: { id: string }) => i.id)
    })

    it('merchant B cannot confirm merchant A\'s order (403)', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({ items: itemIds.map((id) => ({ orderItemId: id, fulfilmentStatus: 'AVAILABLE' })) })
      expect(res.status).toBe(403)
    })

    it('confirming with every item AVAILABLE auto-advances straight to READY_FOR_PICKUP', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ items: itemIds.map((id) => ({ orderItemId: id, fulfilmentStatus: 'AVAILABLE' })) })

      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('READY_FOR_PICKUP')
      expect(res.body.order.confirmedAt).toBeTruthy()
      expect(res.body.order.readyAt).toBeTruthy()

      const events = await prisma.availabilityEvent.findMany({ where: { orderId } })
      expect(events.length).toBe(2)
      for (const event of events) {
        expect(event.newAvailability).toBe('IN_STOCK')
        expect(event.source).toBe('RESERVATION_CONFIRMED')
      }

      const inv1 = await prisma.shopInventory.findUnique({
        where: { shopId_productId: { shopId: shopA.id, productId: productAvailable1 } },
      })
      expect(inv1?.availability).toBe('IN_STOCK')
      expect(inv1?.availabilitySource).toBe('RESERVATION_CONFIRMED')
    })

    it('a wrong pickup code returns 400 and does not transition the order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ pickupCode: '0000' })
      expect(res.status).toBe(400)

      const stillReady = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(stillReady.status).toBe('READY_FOR_PICKUP')
    })

    it('OUT_FOR_DELIVERY is invalid for this RESERVE_AND_COLLECT order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/out-for-delivery`)
        .set('Authorization', `Bearer ${ownerAToken}`)
      expect(res.status).toBe(400)
    })

    it('the correct pickup code completes the order', async () => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
      const res = await request(app)
        .post(`/api/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ pickupCode: order.pickupCode })

      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('COMPLETED')
      expect(res.body.order.paymentStatus).toBe('PAID')
    })
  })

  describe('all items unavailable', () => {
    it('rejects the order (REJECTED_BY_SHOP), not CONFIRMED', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [{ productId: productUnavailable, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
        })
      const itemId = created.body.order.items[0].id

      const res = await request(app)
        .post(`/api/orders/${created.body.order.id}/confirm`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ items: [{ orderItemId: itemId, fulfilmentStatus: 'UNAVAILABLE' }] })

      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('REJECTED_BY_SHOP')
      expect(res.body.order.rejectionReason).toBeTruthy()

      const event = await prisma.availabilityEvent.findFirst({ where: { orderId: created.body.order.id } })
      expect(event?.newAvailability).toBe('OUT_OF_STOCK')
      expect(event?.source).toBe('RESERVATION_REJECTED')
    })
  })

  describe('partial availability', () => {
    it('recalculates the total to only the available items and still reaches READY_FOR_PICKUP', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [
            { productId: productAvailable1, quantity: 1 },
            { productId: productUnavailable, quantity: 1 },
          ],
          paymentMode: 'CASH_ON_PICKUP',
        })
      expect(created.body.order.subtotal).toBe(100)
      const [availableItem, unavailableItem] = created.body.order.items

      const res = await request(app)
        .post(`/api/orders/${created.body.order.id}/confirm`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          items: [
            { orderItemId: availableItem.id, fulfilmentStatus: 'AVAILABLE' },
            { orderItemId: unavailableItem.id, fulfilmentStatus: 'UNAVAILABLE' },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('READY_FOR_PICKUP')
      expect(res.body.order.subtotal).toBe(50)
      expect(res.body.order.total).toBe(50)
    })
  })

  describe('DELIVERY orders', () => {
    it('stays at CONFIRMED (no auto-advance), then OUT_FOR_DELIVERY, then COMPLETED without a pickup code', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'DELIVERY',
          items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_DELIVERY',
        })
      const orderId = created.body.order.id
      const itemId = created.body.order.items[0].id

      const confirmRes = await request(app)
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ items: [{ orderItemId: itemId, fulfilmentStatus: 'AVAILABLE' }] })
      expect(confirmRes.body.order.status).toBe('CONFIRMED')

      const outRes = await request(app)
        .post(`/api/orders/${orderId}/out-for-delivery`)
        .set('Authorization', `Bearer ${ownerAToken}`)
      expect(outRes.status).toBe(200)
      expect(outRes.body.order.status).toBe('OUT_FOR_DELIVERY')

      const completeRes = await request(app)
        .post(`/api/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({})
      expect(completeRes.status).toBe(200)
      expect(completeRes.body.order.status).toBe('COMPLETED')
    })
  })

  describe('cancel and reject', () => {
    it('the owning customer can cancel a PLACED order', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
        })

      const res = await request(app)
        .post(`/api/orders/${created.body.order.id}/cancel`)
        .set('Authorization', `Bearer ${customerAToken}`)
      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('CANCELLED_BY_CUSTOMER')
    })

    it('a different customer cannot cancel someone else\'s order (403)', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
        })

      const res = await request(app)
        .post(`/api/orders/${created.body.order.id}/cancel`)
        .set('Authorization', `Bearer ${customerBToken}`)
      expect(res.status).toBe(403)
    })

    it('the merchant can reject a PLACED order with a reason', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
        })

      const res = await request(app)
        .post(`/api/orders/${created.body.order.id}/reject`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ reason: 'Shop closing early today.' })
      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe('REJECTED_BY_SHOP')
      expect(res.body.order.rejectionReason).toBe('Shop closing early today.')
    })
  })

  describe('order visibility', () => {
    it('a customer can view their own order; a different customer gets 403', async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shopId: shopA.id, type: 'RESERVE_AND_COLLECT',
          items: [{ productId: productAvailable1, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP',
        })
      const orderId = created.body.order.id

      const own = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${customerAToken}`)
      expect(own.status).toBe(200)

      const other = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${customerBToken}`)
      expect(other.status).toBe(403)

      const merchant = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${ownerAToken}`)
      expect(merchant.status).toBe(200)

      const otherMerchant = await request(app).get(`/api/orders/${orderId}`).set('Authorization', `Bearer ${ownerBToken}`)
      expect(otherMerchant.status).toBe(403)
    })
  })
})
