import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'
import { prisma } from '../db'
import { errorMiddleware } from './errors'
import { requireAuth, requireRole, requireShopOwnership, type AuthenticatedRequest } from './authMiddleware'
import { signTokens } from '../modules/auth/auth.service'

/**
 * Self-contained: creates its own merchant + shop fixtures rather than
 * relying on the seeded dataset, since a full `npm test` run truncates
 * `User`/`Shop` in other suites' setup hooks (documented in the README).
 */
const MERCHANT_A_PHONE = '9199991001'
const MERCHANT_B_PHONE = '9199991002'

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

function buildTestApp() {
  const app = express()
  app.get('/whoami', requireAuth, (req, res) => res.json((req as AuthenticatedRequest).auth))
  app.get('/merchant-only', requireAuth, requireRole('MERCHANT'), (_req, res) => res.json({ ok: true }))
  app.get(
    '/shops/:shopId/secret',
    requireAuth,
    requireRole('MERCHANT'),
    requireShopOwnership('shopId'),
    (_req, res) => res.json({ ok: true }),
  )
  app.use(errorMiddleware)
  return app
}

async function cleanup() {
  await prisma.shop.deleteMany({ where: { owner: { phone: { in: [MERCHANT_A_PHONE, MERCHANT_B_PHONE] } } } })
  await prisma.user.deleteMany({ where: { phone: { in: [MERCHANT_A_PHONE, MERCHANT_B_PHONE] } } })
}

describe('auth middleware', () => {
  let merchantAId: string
  let shopAId: string
  let shopBId: string

  beforeAll(async () => {
    await cleanup()
    const merchantA = await prisma.user.create({
      data: { name: 'Merchant A', phone: MERCHANT_A_PHONE, role: 'MERCHANT' },
    })
    const merchantB = await prisma.user.create({
      data: { name: 'Merchant B', phone: MERCHANT_B_PHONE, role: 'MERCHANT' },
    })
    const shopA = await prisma.shop.create({
      data: {
        ownerId: merchantA.id,
        name: 'Shop A',
        nameGu: 'Shop A',
        type: 'KIRANA',
        phone: '9199991099',
        address: '1 Test Lane',
        lat: 23.03,
        lng: 72.56,
        status: 'ACTIVE',
        openingHours: OPENING_HOURS,
      },
    })
    const shopB = await prisma.shop.create({
      data: {
        ownerId: merchantB.id,
        name: 'Shop B',
        nameGu: 'Shop B',
        type: 'KIRANA',
        phone: '9199991098',
        address: '2 Test Lane',
        lat: 23.03,
        lng: 72.56,
        status: 'ACTIVE',
        openingHours: OPENING_HOURS,
      },
    })
    merchantAId = merchantA.id
    shopAId = shopA.id
    shopBId = shopB.id
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  describe('requireAuth', () => {
    it('rejects a missing token with 401', async () => {
      const res = await request(buildTestApp()).get('/whoami')
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('rejects a garbage token with 401', async () => {
      const res = await request(buildTestApp()).get('/whoami').set('Authorization', 'Bearer not-a-real-token')
      expect(res.status).toBe(401)
    })

    it('accepts a valid access token and attaches req.auth', async () => {
      const { accessToken } = signTokens({ id: 'user-1', role: 'CUSTOMER' })
      const res = await request(buildTestApp()).get('/whoami').set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ sub: 'user-1', role: 'CUSTOMER' })
    })
  })

  describe('requireRole', () => {
    it('returns 403 — never 401, never a redirect — for a CUSTOMER token on a merchant-only route', async () => {
      const { accessToken } = signTokens({ id: 'user-1', role: 'CUSTOMER' })
      const res = await request(buildTestApp())
        .get('/merchant-only')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('allows a MERCHANT token through', async () => {
      const { accessToken } = signTokens({ id: 'user-1', role: 'MERCHANT' })
      const res = await request(buildTestApp())
        .get('/merchant-only')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('requireShopOwnership', () => {
    it("403s merchant A reaching for merchant B's shop (cross-tenant)", async () => {
      const { accessToken } = signTokens({ id: merchantAId, role: 'MERCHANT' })
      const res = await request(buildTestApp())
        .get(`/shops/${shopBId}/secret`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(403)
    })

    it('allows a merchant to reach their own shop', async () => {
      const { accessToken } = signTokens({ id: merchantAId, role: 'MERCHANT' })
      const res = await request(buildTestApp())
        .get(`/shops/${shopAId}/secret`)
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
    })
  })
})
