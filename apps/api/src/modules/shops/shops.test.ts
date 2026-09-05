import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'

/**
 * These tests create their own fixtures rather than depending on the seeded
 * demo dataset (several suites in this repo truncate core tables). Distinct
 * phone numbers/emails in the 919999xxxx range keep fixtures from colliding
 * with the seed's 900000000x range or with other test files.
 */

const app = createApp()

const ANCHOR = { lat: 23.0365, lng: 72.5611 }

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' },
  tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' },
  thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' },
  sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' },
  isTemporarilyClosed: false,
}

const OWNER_A_PHONE = '9188880001'
const OWNER_B_PHONE = '9188880002'

async function makeOwner(phone: string, password = 'shop-owner-pass') {
  return prisma.user.create({
    data: { name: 'Fixture Owner', phone, role: 'MERCHANT', passwordHash: await argon2.hash(password) },
  })
}

async function makeShop(opts: {
  ownerId: string
  name: string
  distanceMetres: number
  bearingDegrees: number
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  openingHours?: unknown
}) {
  // Reuse the same offset math as the real seed, inlined here so this file
  // has no dependency on prisma/seed/* internals.
  const angular = opts.distanceMetres / 6_371_000
  const bearing = (opts.bearingDegrees * Math.PI) / 180
  const lat1 = (ANCHOR.lat * Math.PI) / 180
  const lng1 = (ANCHOR.lng * Math.PI) / 180
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing))
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2))
  const lat = (lat2 * 180) / Math.PI
  const lng = (lng2 * 180) / Math.PI

  const shop = await prisma.shop.create({
    data: {
      ownerId: opts.ownerId,
      name: opts.name,
      nameGu: opts.name,
      type: 'KIRANA',
      phone: '9188880099',
      address: 'Fixture Address, Navrangpura',
      lat,
      lng,
      status: opts.status ?? 'ACTIVE',
      openingHours: opts.openingHours ?? OPEN_ALL_DAY,
    },
  })
  await prisma.$executeRaw`
    UPDATE "Shop" SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${shop.id}
  `
  return shop
}

async function cleanup() {
  const fixtureShops = await prisma.shop.findMany({ where: { phone: '9188880099' }, select: { id: true } })
  const fixtureShopIds = fixtureShops.map((s) => s.id)
  if (fixtureShopIds.length > 0) {
    await prisma.availabilityEvent.deleteMany({ where: { shopId: { in: fixtureShopIds } } })
    await prisma.shopInventory.deleteMany({ where: { shopId: { in: fixtureShopIds } } })
  }
  await prisma.shop.deleteMany({ where: { phone: '9188880099' } })
  await prisma.user.deleteMany({ where: { phone: { in: [OWNER_A_PHONE, OWNER_B_PHONE] } } })
}

describe('shops endpoints', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()
  })
  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  describe('GET /nearby', () => {
    it('returns shops within radius, ordered by distance, with distanceMeters and isOpenNow', async () => {
      const owner = await makeOwner(OWNER_A_PHONE)
      await makeShop({ ownerId: owner.id, name: 'Near Shop 1', distanceMetres: 80, bearingDegrees: 10 })
      await makeShop({ ownerId: owner.id, name: 'Near Shop 2', distanceMetres: 120, bearingDegrees: 200 })
      await makeShop({ ownerId: owner.id, name: 'Near Shop 3', distanceMetres: 140, bearingDegrees: 300 })

      const res = await request(app)
        .get('/api/shops/nearby')
        .query({ lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 150 })

      expect(res.status).toBe(200)
      expect(res.body.shops.length).toBeGreaterThanOrEqual(3)
      const names = res.body.shops.map((s: { name: string }) => s.name)
      expect(names).toContain('Near Shop 1')
      expect(names).toContain('Near Shop 2')
      expect(names).toContain('Near Shop 3')

      // Ordered by distance ascending.
      const distances = res.body.shops.map((s: { distanceMeters: number }) => s.distanceMeters)
      expect([...distances]).toEqual([...distances].sort((a, b) => a - b))
      for (const shop of res.body.shops) {
        expect(typeof shop.isOpenNow).toBe('boolean')
      }
    })

    it('a wider radius returns at least as many shops as a narrower one', async () => {
      const narrow = await request(app).get('/api/shops/nearby').query({ lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 150 })
      const wide = await request(app).get('/api/shops/nearby').query({ lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 250 })
      expect(wide.body.shops.length).toBeGreaterThanOrEqual(narrow.body.shops.length)
    })

    it('never surfaces a PENDING or SUSPENDED shop', async () => {
      const owner = await makeOwner('9188880003')
      const pending = await makeShop({ ownerId: owner.id, name: 'Pending Shop', distanceMetres: 90, bearingDegrees: 50, status: 'PENDING' })
      const suspended = await makeShop({ ownerId: owner.id, name: 'Suspended Shop', distanceMetres: 95, bearingDegrees: 55, status: 'SUSPENDED' })

      const res = await request(app).get('/api/shops/nearby').query({ lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
      const ids = res.body.shops.map((s: { id: string }) => s.id)
      expect(ids).not.toContain(pending.id)
      expect(ids).not.toContain(suspended.id)

      await prisma.shop.deleteMany({ where: { id: { in: [pending.id, suspended.id] } } })
      await prisma.user.deleteMany({ where: { phone: '9188880003' } })
    })

    it('distances agree with a direct PostGIS ST_Distance call within 1 metre', async () => {
      const owner = await makeOwner('9188880004')
      const shop = await makeShop({ ownerId: owner.id, name: 'Distance Check Shop', distanceMetres: 300, bearingDegrees: 77 })

      const res = await request(app).get('/api/shops/nearby').query({ lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
      const found = res.body.shops.find((s: { id: string }) => s.id === shop.id)
      expect(found).toBeDefined()

      const [{ distance }] = await prisma.$queryRaw<{ distance: number }[]>`
        SELECT ST_Distance(location, ST_SetSRID(ST_MakePoint(${ANCHOR.lng}, ${ANCHOR.lat}), 4326)::geography) AS distance
        FROM "Shop" WHERE id = ${shop.id}
      `
      expect(Math.abs(found.distanceMeters - distance)).toBeLessThanOrEqual(1)

      await prisma.shop.delete({ where: { id: shop.id } })
      await prisma.user.deleteMany({ where: { phone: '9188880004' } })
    })
  })

  describe('isOpenNow honours isTemporarilyClosed', () => {
    it('is false when the shop is temporarily closed even inside normal hours', async () => {
      const owner = await makeOwner('9188880005')
      const shop = await makeShop({
        ownerId: owner.id,
        name: 'Temp Closed Shop',
        distanceMetres: 100,
        bearingDegrees: 15,
        openingHours: { ...OPEN_ALL_DAY, isTemporarilyClosed: true },
      })

      const res = await request(app).get(`/api/shops/${shop.id}`)
      expect(res.status).toBe(200)
      expect(res.body.shop.isOpenNow).toBe(false)

      await prisma.shop.delete({ where: { id: shop.id } })
      await prisma.user.deleteMany({ where: { phone: '9188880005' } })
    })
  })

  describe('ownership: PATCH /:id', () => {
    it('merchant A editing merchant B\'s shop is rejected with 403', async () => {
      const ownerA = await makeOwner('9188880010', 'owner-a-pass')
      const ownerB = await makeOwner('9188880011', 'owner-b-pass')
      const shopB = await makeShop({ ownerId: ownerB.id, name: 'Owner B Shop', distanceMetres: 200, bearingDegrees: 0 })

      const loginA = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: '9188880010', password: 'owner-a-pass' })
      expect(loginA.status).toBe(200)

      const res = await request(app)
        .patch(`/api/shops/${shopB.id}`)
        .set('Authorization', `Bearer ${loginA.body.accessToken}`)
        .send({ description: 'hijacked' })

      expect(res.status).toBe(403)

      await prisma.shop.delete({ where: { id: shopB.id } })
      await prisma.user.deleteMany({ where: { phone: { in: ['9188880010', '9188880011'] } } })
    })

    it('the owning merchant can edit their own shop, including hours', async () => {
      const owner = await makeOwner('9188880006', 'own-shop-pass')
      const shop = await makeShop({ ownerId: owner.id, name: 'Editable Shop', distanceMetres: 60, bearingDegrees: 5 })

      const login = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: '9188880006', password: 'own-shop-pass' })

      const res = await request(app)
        .patch(`/api/shops/${shop.id}`)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ description: 'Updated description', openingHours: { ...OPEN_ALL_DAY, isTemporarilyClosed: true } })

      expect(res.status).toBe(200)
      expect(res.body.shop.description).toBe('Updated description')

      const detail = await request(app).get(`/api/shops/${shop.id}`)
      expect(detail.body.shop.isOpenNow).toBe(false)

      await prisma.shop.delete({ where: { id: shop.id } })
      await prisma.user.deleteMany({ where: { phone: '9188880006' } })
    })

    it('a CUSTOMER token on a merchant-only shop route gets 403, not a redirect', async () => {
      const owner = await makeOwner('9188880007', 'cust-check-pass')
      const shop = await makeShop({ ownerId: owner.id, name: 'Customer Check Shop', distanceMetres: 70, bearingDegrees: 5 })

      const customerVerify = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: '9188880008', otp: '123456' })

      const res = await request(app)
        .patch(`/api/shops/${shop.id}`)
        .set('Authorization', `Bearer ${customerVerify.body.accessToken}`)
        .send({ description: 'should not work' })

      expect(res.status).toBe(403)

      await prisma.shop.delete({ where: { id: shop.id } })
      await prisma.user.deleteMany({ where: { phone: { in: ['9188880007', '9188880008'] } } })
    })
  })

  describe('inventory', () => {
    it('PUT bulk upserts prices/availability and writes an AvailabilityEvent per item', async () => {
      const owner = await makeOwner('9188880009', 'inv-owner-pass')
      const shop = await makeShop({ ownerId: owner.id, name: 'Inventory Shop', distanceMetres: 60, bearingDegrees: 5 })
      const category = await prisma.category.create({
        data: { name: 'Fixture Cat', nameGu: 'Fixture Cat', slug: `fixture-cat-${shop.id}`, iconName: 'box' },
      })
      const product = await prisma.product.create({
        data: {
          name: 'Fixture Product', nameGu: 'Fixture Product', categoryId: category.id,
          unitType: 'PIECE', defaultUnitLabel: '1 pc', searchKeywords: ['fixture'],
        },
      })

      const login = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: '9188880009', password: 'inv-owner-pass' })

      const res = await request(app)
        .put(`/api/shops/${shop.id}/inventory`)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ items: [{ productId: product.id, price: 42, availability: 'IN_STOCK' }] })

      expect(res.status).toBe(200)
      expect(res.body.items[0].price).toBe(42)
      expect(res.body.items[0].availability).toBe('IN_STOCK')

      const events = await prisma.availabilityEvent.findMany({ where: { shopId: shop.id, productId: product.id } })
      expect(events.length).toBe(1)
      expect(events[0].source).toBe('MERCHANT_MANUAL')
      expect(events[0].newAvailability).toBe('IN_STOCK')

      const invRes = await request(app).get(`/api/shops/${shop.id}/inventory`)
      expect(invRes.status).toBe(200)
      expect(invRes.body.items.length).toBe(1)

      await prisma.availabilityEvent.deleteMany({ where: { shopId: shop.id } })
      await prisma.shopInventory.deleteMany({ where: { shopId: shop.id } })
      await prisma.product.delete({ where: { id: product.id } })
      await prisma.category.delete({ where: { id: category.id } })
      await prisma.shop.delete({ where: { id: shop.id } })
      await prisma.user.deleteMany({ where: { phone: '9188880009' } })
    })
  })
})
