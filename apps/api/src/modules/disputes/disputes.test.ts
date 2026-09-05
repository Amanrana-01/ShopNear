import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'

/**
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables. Distinct phone numbers in the 9166662xxx range
 * keep this file's fixtures isolated from other suites.
 */

const app = createApp()

const OWNER_PHONE = '9166662001'
const CUSTOMER_A_PHONE = '9166662011'
const CUSTOMER_B_PHONE = '9166662012'
const ADMIN_EMAIL = 'disputes-fixture-admin@shopnear.local'

let shopId: string
let productId: string
let customerAId: string
let customerAToken: string
let customerBToken: string
let ownerToken: string
let adminToken: string

let orderCounter = 0

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

async function makeOrder(customerId: string) {
  orderCounter += 1
  return prisma.order.create({
    data: {
      orderNumber: `SN-DISP-${Date.now()}-${orderCounter}`,
      customerId,
      shopId,
      type: 'RESERVE_AND_COLLECT',
      status: 'PLACED',
      subtotal: 50,
      total: 50,
      paymentMode: 'CASH_ON_PICKUP',
      pickupCode: '1234',
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
        await prisma.dispute.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    }
    await prisma.user.delete({ where: { id: owner.id } })
  }
  await prisma.user.deleteMany({ where: { phone: { in: [CUSTOMER_A_PHONE, CUSTOMER_B_PHONE] }, role: 'CUSTOMER' } })
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } })
  await prisma.product.deleteMany({ where: { name: 'Fixture Dispute Product' } })
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'disputes-fixture-cat' } } })
}

describe('disputes API', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    const category = await prisma.category.create({
      data: { name: 'Disputes Fixture Cat', nameGu: 'Disputes Fixture Cat', slug: `disputes-fixture-cat-${Date.now()}`, iconName: 'box' },
    })
    const product = await prisma.product.create({
      data: { name: 'Fixture Dispute Product', nameGu: 'Fixture Dispute Product', categoryId: category.id, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: ['fixture'] },
    })
    productId = product.id

    const owner = await prisma.user.create({
      data: { name: 'Dispute Fixture Owner', phone: OWNER_PHONE, role: 'MERCHANT', passwordHash: await argon2.hash('owner-pass') },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Dispute Fixture Shop', nameGu: 'Dispute Fixture Shop', type: 'KIRANA',
        phone: '9166669997', address: 'Dispute Fixture Address', lat: 23.037, lng: 72.5615,
        status: 'ACTIVE', openingHours: OPEN_ALL_DAY,
      },
    })
    shopId = shop.id

    await prisma.user.create({
      data: { name: 'Dispute Fixture Admin', phone: '9166662099', role: 'ADMIN', email: ADMIN_EMAIL, passwordHash: await argon2.hash('admin-pass') },
    })

    const custA = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_A_PHONE, otp: '123456' })
    customerAId = custA.body.user.id
    customerAToken = custA.body.accessToken
    const custB = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_B_PHONE, otp: '123456' })
    customerBToken = custB.body.accessToken

    const loginOwner = await request(app).post('/api/auth/merchant/login').send({ phone: OWNER_PHONE, password: 'owner-pass' })
    ownerToken = loginOwner.body.accessToken
    const loginAdmin = await request(app).post('/api/auth/admin/login').send({ email: ADMIN_EMAIL, password: 'admin-pass' })
    adminToken = loginAdmin.body.accessToken
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('lets the owning customer raise a dispute against their own order', async () => {
    const order = await makeOrder(customerAId)
    const res = await request(app)
      .post(`/api/orders/${order.id}/disputes`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ reason: 'ITEM_NOT_AVAILABLE_ON_ARRIVAL', description: 'Shop said they had none when I arrived.' })
    expect(res.status).toBe(201)
    expect(res.body.dispute.status).toBe('OPEN')
  })

  it('rejects a dispute raised by someone other than the order\'s own customer with 403', async () => {
    const order = await makeOrder(customerAId)
    const res = await request(app)
      .post(`/api/orders/${order.id}/disputes`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ reason: 'OTHER', description: 'Not my order.' })
    expect(res.status).toBe(403)
  })

  it('a MERCHANT token cannot hit the admin dispute-list route (403)', async () => {
    const res = await request(app).get('/api/admin/disputes').set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(403)
  })

  it('a CUSTOMER token cannot hit the admin dispute-list route (403)', async () => {
    const res = await request(app).get('/api/admin/disputes').set('Authorization', `Bearer ${customerAToken}`)
    expect(res.status).toBe(403)
  })

  it('an admin lists open disputes and resolves one with a note', async () => {
    const order = await makeOrder(customerAId)
    const created = await request(app)
      .post(`/api/orders/${order.id}/disputes`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ reason: 'PRICE_MISMATCH', description: 'Charged more than the app price.' })
    const disputeId = created.body.dispute.id

    const list = await request(app)
      .get('/api/admin/disputes?status=OPEN')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(list.status).toBe(200)
    expect(list.body.disputes.some((d: { id: string }) => d.id === disputeId)).toBe(true)

    const resolve = await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', adminNote: 'Refunded the price difference in cash.' })
    expect(resolve.status).toBe(200)
    expect(resolve.body.dispute.status).toBe('RESOLVED')
    expect(resolve.body.dispute.adminNote).toBe('Refunded the price difference in cash.')
    expect(resolve.body.dispute.resolvedAt).toBeTruthy()

    const stillListed = await request(app)
      .get('/api/admin/disputes?status=OPEN')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(stillListed.body.disputes.some((d: { id: string }) => d.id === disputeId)).toBe(false)
  })
})
