import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'

const app = createApp()

/**
 * IMPORTANT: these tests do not depend on the seeded demo dataset.
 * Several existing suites in this repo `TRUNCATE ... RESTART IDENTITY
 * CASCADE` core tables (including `User`) as part of their own setup, so a
 * full `npm test` run empties the database — that's documented, expected
 * behaviour here, not a bug. Every fixture this file needs is created (and
 * cleaned up) by this file itself, so it passes whether or not someone has
 * just run `npm run db:reset`.
 *
 * The one exception is the "documented demo credentials" block below, which
 * exists specifically to prove the README's demo accounts work end to end —
 * it *upserts* those exact rows first rather than assuming they survived.
 */

// Distinct phone numbers so this file's fixtures never collide with the
// seed's 900000000x range or with each other.
const NEW_CUSTOMER_PHONE = '9199990001'
const DUAL_ROLE_PHONE = '9199990002'
const MERCHANT_PHONE = '9199990003'
const CUSTOMER_ONLY_PHONE = '9199990004'
const TWO_SHOP_MERCHANT_PHONE = '9199990005'
const ADMIN_EMAIL = 'test-admin@shopnear.local'

const FIXTURE_PHONES = [
  NEW_CUSTOMER_PHONE,
  DUAL_ROLE_PHONE,
  MERCHANT_PHONE,
  CUSTOMER_ONLY_PHONE,
  TWO_SHOP_MERCHANT_PHONE,
]

const OPENING_HOURS = {
  mon: { open: '09:00', close: '21:00' },
  tue: { open: '09:00', close: '21:00' },
  wed: { open: '09:00', close: '21:00' },
  thu: { open: '09:00', close: '21:00' },
  fri: { open: '09:00', close: '21:00' },
  sat: { open: '09:00', close: '21:00' },
  sun: { open: '10:00', close: '14:00' },
  isTemporarilyClosed: false,
}

async function makeShop(ownerId: string, name: string) {
  return prisma.shop.create({
    data: {
      ownerId,
      name,
      nameGu: name,
      type: 'KIRANA',
      phone: '9199990099',
      address: '1 Test Lane, Navrangpura',
      lat: 23.03,
      lng: 72.56,
      status: 'ACTIVE',
      openingHours: OPENING_HOURS,
    },
  })
}

async function cleanup() {
  await prisma.shop.deleteMany({ where: { owner: { phone: { in: FIXTURE_PHONES } } } })
  await prisma.user.deleteMany({ where: { phone: { in: FIXTURE_PHONES } } })
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } })
}

describe('auth endpoints', () => {
  beforeAll(cleanup)
  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  describe('customer OTP flow', () => {
    it('POST /otp/request logs the OTP and reports sent', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ phone: NEW_CUSTOMER_PHONE, role: 'CUSTOMER' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ sent: true })
    })

    it('POST /otp/verify rejects the wrong OTP with 401', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: NEW_CUSTOMER_PHONE, otp: '000000' })
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('POST /otp/verify with the correct OTP auto-creates a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: NEW_CUSTOMER_PHONE, otp: '123456' })
      expect(res.status).toBe(200)
      expect(res.body.isNewUser).toBe(true)
      expect(res.body.user.role).toBe('CUSTOMER')
      expect(res.body.user.phone).toBe(NEW_CUSTOMER_PHONE)
      expect(res.body.user.passwordHash).toBeUndefined()
      expect(typeof res.body.accessToken).toBe('string')
      expect(typeof res.body.refreshToken).toBe('string')
    })

    it('a repeat verify for the same phone is not a new user and reuses the id', async () => {
      const first = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: NEW_CUSTOMER_PHONE, otp: '123456' })
      const second = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: NEW_CUSTOMER_PHONE, otp: '123456' })
      expect(second.body.isNewUser).toBe(false)
      expect(second.body.user.id).toBe(first.body.user.id)
    })

    it('POST /customer/profile completes first-time setup', async () => {
      const verify = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: NEW_CUSTOMER_PHONE, otp: '123456' })

      const res = await request(app)
        .post('/api/auth/customer/profile')
        .set('Authorization', `Bearer ${verify.body.accessToken}`)
        .send({
          name: 'Test Customer',
          address: { label: 'Home', line1: '1 Test Street', pincode: '380009', lat: 23.03, lng: 72.56 },
        })

      expect(res.status).toBe(200)
      expect(res.body.user.name).toBe('Test Customer')
      expect(res.body.address.pincode).toBe('380009')
    })
  })

  describe('merchant login', () => {
    it('succeeds with the correct password', async () => {
      await prisma.user.create({
        data: {
          name: 'Fixture Merchant',
          phone: MERCHANT_PHONE,
          role: 'MERCHANT',
          passwordHash: await argon2.hash('fixture-pass-1'),
        },
      })

      const res = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: MERCHANT_PHONE, password: 'fixture-pass-1' })
      expect(res.status).toBe(200)
      expect(res.body.user.role).toBe('MERCHANT')
      expect(res.body.user.passwordHash).toBeUndefined()
      expect(typeof res.body.accessToken).toBe('string')
      expect(typeof res.body.refreshToken).toBe('string')
    })

    it('rejects a wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: MERCHANT_PHONE, password: 'not-the-password' })
      expect(res.status).toBe(401)
    })

    it('never lets a customer (no passwordHash) log in through this route', async () => {
      await prisma.user.create({
        data: { name: 'Fixture Customer', phone: CUSTOMER_ONLY_PHONE, role: 'CUSTOMER' },
      })

      const res = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: CUSTOMER_ONLY_PHONE, password: 'anything' })
      expect(res.status).toBe(401)
    })
  })

  describe('admin login', () => {
    it('succeeds by email + password', async () => {
      await prisma.user.create({
        data: {
          name: 'Fixture Admin',
          phone: '9199990098',
          role: 'ADMIN',
          email: ADMIN_EMAIL,
          passwordHash: await argon2.hash('fixture-admin-pass'),
        },
      })

      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: ADMIN_EMAIL, password: 'fixture-admin-pass' })
      expect(res.status).toBe(200)
      expect(res.body.user.role).toBe('ADMIN')
    })

    it('rejects a wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: ADMIN_EMAIL, password: 'wrong' })
      expect(res.status).toBe(401)
    })
  })

  describe('one phone, two roles (spec R7)', () => {
    it('a customer and a merchant on the same phone are two distinct user ids', async () => {
      const merchant = await prisma.user.create({
        data: {
          name: 'Dual Role Merchant',
          phone: DUAL_ROLE_PHONE,
          role: 'MERCHANT',
          passwordHash: await argon2.hash('dual-role-pass'),
        },
      })

      const verify = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: DUAL_ROLE_PHONE, otp: '123456' })

      expect(verify.status).toBe(200)
      expect(verify.body.user.role).toBe('CUSTOMER')
      expect(verify.body.user.id).not.toBe(merchant.id)

      const merchantLogin = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: DUAL_ROLE_PHONE, password: 'dual-role-pass' })
      expect(merchantLogin.body.user.id).toBe(merchant.id)
      expect(merchantLogin.body.user.id).not.toBe(verify.body.user.id)
    })
  })

  describe('POST /refresh', () => {
    it('rotates to a fresh token pair that also works', async () => {
      const login = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: MERCHANT_PHONE, password: 'fixture-pass-1' })

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.refreshToken })
      expect(res.status).toBe(200)
      expect(typeof res.body.accessToken).toBe('string')
      expect(typeof res.body.refreshToken).toBe('string')

      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`)
      expect(me.status).toBe(200)
    })

    it('rejects an access token used where a refresh token belongs', async () => {
      const login = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: MERCHANT_PHONE, password: 'fixture-pass-1' })

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.accessToken })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /me', () => {
    it('rejects a missing token with 401', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })

    it('returns both shops, as an array, for a merchant who owns two', async () => {
      const merchant = await prisma.user.create({
        data: {
          name: 'Two Shop Merchant',
          phone: TWO_SHOP_MERCHANT_PHONE,
          role: 'MERCHANT',
          passwordHash: await argon2.hash('two-shop-pass'),
        },
      })
      await makeShop(merchant.id, 'Fixture Shop One')
      await makeShop(merchant.id, 'Fixture Shop Two')

      const login = await request(app)
        .post('/api/auth/merchant/login')
        .send({ phone: TWO_SHOP_MERCHANT_PHONE, password: 'two-shop-pass' })

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.shops)).toBe(true)
      expect(res.body.shops.length).toBe(2)
    })
  })
})

describe('documented demo credentials (README)', () => {
  // Unlike the rest of this file, these tests specifically exist to prove
  // the demo accounts published in the README/spec work end to end — so
  // they upsert those exact rows first rather than assuming a seed run
  // happened to leave them in place.
  const DEMO_MERCHANT_PHONE = '9000000010'
  const DEMO_ADMIN_EMAIL = 'admin@shopnear.local'

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { phone_role: { phone: DEMO_MERCHANT_PHONE, role: 'MERCHANT' } },
      create: {
        name: 'Rajesh Patel',
        phone: DEMO_MERCHANT_PHONE,
        role: 'MERCHANT',
        passwordHash: await argon2.hash('demo1234'),
      },
      update: { passwordHash: await argon2.hash('demo1234') },
    })

    await prisma.user.upsert({
      where: { email: DEMO_ADMIN_EMAIL },
      create: {
        name: 'ShopNear Admin',
        phone: '9000000000',
        role: 'ADMIN',
        email: DEMO_ADMIN_EMAIL,
        passwordHash: await argon2.hash('admin1234'),
      },
      update: { passwordHash: await argon2.hash('admin1234') },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('the documented merchant demo account logs in with demo1234', async () => {
    const res = await request(app)
      .post('/api/auth/merchant/login')
      .send({ phone: DEMO_MERCHANT_PHONE, password: 'demo1234' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('MERCHANT')
  })

  it('the documented admin demo account logs in with admin1234', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: DEMO_ADMIN_EMAIL, password: 'admin1234' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('ADMIN')
  })

  it('the documented customer demo phone (9000000001) logs in via OTP 123456', async () => {
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone: '9000000001', otp: '123456' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('CUSTOMER')
  })
})
