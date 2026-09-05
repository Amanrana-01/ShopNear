import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'
import { prisma } from '../../db'

/**
 * Fixtures built here, not borrowed from the seed — several suites in this
 * repo truncate core tables, so nothing can depend on seeded rows surviving.
 * Distinct phone numbers in the 9177xxxxxx range keep this file's fixtures
 * from colliding with other suites' ranges.
 */

const app = createApp()

const OWNER_PHONE = '9177770001'
const DUPLICATE_PHONE = '9177770002'
const SHARED_PHONE = '9177770003' // exercises the (phone, role) uniqueness split

let categoryId: string
let starterProductIds: string[] = []

function baseRegistrationPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    owner: {
      name: 'Test Owner',
      phone: OWNER_PHONE,
      password: 'super-secret-1',
      preferredLanguage: 'en',
    },
    shop: {
      name: 'Fixture Registered Shop',
      nameGu: 'Fixture Registered Shop',
      type: 'CHEMIST',
      description: 'A freshly registered shop.',
      phone: OWNER_PHONE,
    },
    location: {
      address: 'Fixture Lane, Navrangpura',
      landmark: 'Near the fixture',
      pincode: '380009',
      lat: 23.037,
      lng: 72.5615,
    },
    openingHours: {
      mon: { open: '09:00', close: '21:00' },
      tue: { open: '09:00', close: '21:00' },
      wed: { open: '09:00', close: '21:00' },
      thu: { open: '09:00', close: '21:00' },
      fri: { open: '09:00', close: '21:00' },
      sat: { open: '09:00', close: '21:00' },
      sun: null,
      isTemporarilyClosed: false,
    },
    fulfilment: { acceptsDelivery: false, deliveryRadiusMeters: 0, minOrderValue: 0, deliveryFee: 0 },
    verification: { licenceNumber: 'GST-FIXTURE-001' },
    starterItems: starterProductIds.map((productId, i) => ({ productId, price: 10 + i })),
    ...overrides,
  }
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { phone: { in: [OWNER_PHONE, DUPLICATE_PHONE, SHARED_PHONE] } },
    select: { id: true },
  })
  const userIds = users.map((u) => u.id)
  const shops = await prisma.shop.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } })
  const shopIds = shops.map((s) => s.id)

  if (shopIds.length > 0) {
    await prisma.availabilityEvent.deleteMany({ where: { shopId: { in: shopIds } } })
    await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
    await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
  }
  await prisma.address.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

describe('merchant registration', () => {
  beforeAll(async () => {
    await cleanup()

    categoryId = (
      await prisma.category.create({
        data: { name: 'Registration Fixture Cat', nameGu: 'Registration Fixture Cat', slug: `reg-fixture-cat-${Date.now()}`, iconName: 'box' },
      })
    ).id

    const products = await Promise.all(
      ['Fixture Thermometer', 'Fixture Bandage Roll', 'Fixture Antiseptic'].map((name) =>
        prisma.product.create({
          data: { name, nameGu: name, categoryId, unitType: 'PIECE', defaultUnitLabel: '1 pc', searchKeywords: [name.toLowerCase()] },
        }),
      ),
    )
    starterProductIds = products.map((p) => p.id)

    await prisma.starterCatalogueItem.createMany({
      data: starterProductIds.map((productId, i) => ({ shopType: 'CHEMIST' as const, productId, suggestedPrice: 20 + i })),
    })
  })

  afterAll(async () => {
    await cleanup()
    await prisma.starterCatalogueItem.deleteMany({ where: { productId: { in: starterProductIds } } })
    await prisma.product.deleteMany({ where: { id: { in: starterProductIds } } })
    await prisma.category.delete({ where: { id: categoryId } })
    await prisma.$disconnect()
  })

  describe('GET /starter-catalogue', () => {
    it('returns the curated list for a shop type, including our fixtures', async () => {
      const res = await request(app).get('/api/merchants/starter-catalogue').query({ shopType: 'CHEMIST' })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.items)).toBe(true)
      const returnedIds = res.body.items.map((i: { productId: string }) => i.productId)
      for (const id of starterProductIds) expect(returnedIds).toContain(id)
      const ours = res.body.items.filter((i: { productId: string }) => starterProductIds.includes(i.productId))
      expect(ours.length).toBe(3)
      for (const item of ours) {
        expect(typeof item.suggestedPrice).toBe('number')
        expect(typeof item.name).toBe('string')
      }
    })
  })

  describe('POST /register', () => {
    it('creates User + Shop (PENDING) + Address + starter inventory atomically, and returns tokens', async () => {
      const res = await request(app).post('/api/merchants/register').send(baseRegistrationPayload())

      expect(res.status).toBe(201)
      expect(res.body.shop.status).toBe('PENDING')
      expect(res.body.tokens.accessToken).toBeTruthy()
      expect(res.body.tokens.refreshToken).toBeTruthy()
      expect(res.body.user.phone).toBe(OWNER_PHONE)
      expect(res.body.user.passwordHash).toBeUndefined()

      const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: res.body.user.id } })
      expect(dbUser.defaultAddressId).toBeTruthy()

      const address = await prisma.address.findUnique({ where: { id: dbUser.defaultAddressId! } })
      expect(address?.pincode).toBe('380009')

      const inventory = await prisma.shopInventory.findMany({ where: { shopId: res.body.shop.id } })
      expect(inventory.length).toBe(3)
      const prices = inventory.map((i) => i.price).sort((a, b) => a - b)
      expect(prices).toEqual([10, 11, 12])
      for (const row of inventory) expect(row.availabilitySource).toBe('SEED')

      // A PENDING shop can be read, but the orders module must refuse to
      // accept a reservation against it (spec §5) — asserted in orders tests.
      const detail = await request(app).get(`/api/shops/${res.body.shop.id}`)
      expect(detail.status).toBe(200)
      expect(detail.body.shop.status).toBe('PENDING')
    })

    it('rejects a duplicate (phone, MERCHANT) registration with 409', async () => {
      const first = await request(app)
        .post('/api/merchants/register')
        .send(baseRegistrationPayload({ owner: { name: 'Dup One', phone: DUPLICATE_PHONE, password: 'password-one', preferredLanguage: 'en' } }))
      expect(first.status).toBe(201)

      const second = await request(app)
        .post('/api/merchants/register')
        .send(baseRegistrationPayload({ owner: { name: 'Dup Two', phone: DUPLICATE_PHONE, password: 'password-two', preferredLanguage: 'en' } }))
      expect(second.status).toBe(409)
    })

    it('does not disturb an existing customer account on the same phone', async () => {
      const customer = await prisma.user.create({
        data: { name: 'Existing Customer', phone: SHARED_PHONE, role: 'CUSTOMER' },
      })

      const res = await request(app)
        .post('/api/merchants/register')
        .send(baseRegistrationPayload({ owner: { name: 'Shared Phone Merchant', phone: SHARED_PHONE, password: 'password-three', preferredLanguage: 'en' } }))

      expect(res.status).toBe(201)
      expect(res.body.user.id).not.toBe(customer.id)

      const stillThere = await prisma.user.findUnique({ where: { id: customer.id } })
      expect(stillThere).not.toBeNull()
      expect(stillThere?.role).toBe('CUSTOMER')

      const merchantRow = await prisma.user.findUnique({ where: { phone_role: { phone: SHARED_PHONE, role: 'MERCHANT' } } })
      expect(merchantRow?.id).toBe(res.body.user.id)
    })
  })

  describe('POST /uploads', () => {
    it('accepts an allowed image type and returns a URL', async () => {
      const res = await request(app)
        .post('/api/merchants/uploads')
        .attach('file', Buffer.from('fake-png-bytes'), { filename: 'shopfront.png', contentType: 'image/png' })

      expect(res.status).toBe(201)
      expect(res.body.url).toMatch(/^\/uploads\/.+\.png$/)
    })

    it('rejects a disallowed file type with 400', async () => {
      const res = await request(app)
        .post('/api/merchants/uploads')
        .attach('file', Buffer.from('just some text'), { filename: 'notes.txt', contentType: 'text/plain' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBeDefined()
    })
  })
})
