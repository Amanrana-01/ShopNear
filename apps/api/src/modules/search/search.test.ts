import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { getRankingWeights, setRankingWeights } from '../../config/runtimeConfig'

/**
 * Self-contained fixtures — several suites in this repo truncate core
 * tables, so this file never assumes the seeded demo dataset survived (see
 * the note in auth.test.ts). The one place we specifically want to prove
 * out the seeded "atta" story, we build our own equivalent fixture instead
 * of depending on `npm run db:reset` having just run.
 */

const app = createApp()
const ANCHOR = { lat: 23.0365, lng: 72.5611 }

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

const SHOP_PHONE = '9177770099'

function offsetPoint(distanceMetres: number, bearingDegrees: number) {
  const angular = distanceMetres / 6_371_000
  const bearing = (bearingDegrees * Math.PI) / 180
  const lat1 = (ANCHOR.lat * Math.PI) / 180
  const lng1 = (ANCHOR.lng * Math.PI) / 180
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing))
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1), Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2))
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI }
}

let ownerCounter = 0
async function makeShopWithProduct(opts: {
  distanceMetres: number
  bearingDegrees: number
  keywords: string[]
  productName: string
  price: number
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'USUALLY_AVAILABLE' | 'UNKNOWN'
  ageMinutes: number
}) {
  ownerCounter += 1
  const ownerPhone = `917777${String(9000 + ownerCounter).padStart(4, '0')}`
  const owner = await prisma.user.create({
    data: { name: 'Fixture Owner', phone: ownerPhone, role: 'MERCHANT', passwordHash: await argon2.hash('x') },
  })
  const { lat, lng } = offsetPoint(opts.distanceMetres, opts.bearingDegrees)
  const shop = await prisma.shop.create({
    data: {
      ownerId: owner.id, name: `Fixture Shop ${ownerCounter}`, nameGu: `Fixture Shop ${ownerCounter}`,
      type: 'KIRANA', phone: SHOP_PHONE, address: 'Fixture Address, Navrangpura',
      lat, lng, status: 'ACTIVE', openingHours: OPEN_ALL_DAY,
    },
  })
  await prisma.$executeRaw`
    UPDATE "Shop" SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography WHERE id = ${shop.id}
  `
  const category = await prisma.category.create({
    data: { name: 'Fixture Cat', nameGu: 'Fixture Cat', slug: `fixture-cat-${shop.id}`, iconName: 'box' },
  })
  const product = await prisma.product.create({
    data: {
      name: opts.productName, nameGu: opts.productName, categoryId: category.id,
      unitType: 'WEIGHT', defaultUnitLabel: '5 kg', searchKeywords: opts.keywords,
    },
  })
  const updatedAt = new Date(clock.now().getTime() - opts.ageMinutes * 60_000)
  await prisma.shopInventory.create({
    data: {
      shopId: shop.id, productId: product.id, price: opts.price,
      availability: opts.availability, availabilityUpdatedAt: updatedAt, availabilitySource: 'SEED',
    },
  })
  return { owner, shop, category, product }
}

async function cleanup() {
  const shops = await prisma.shop.findMany({ where: { phone: SHOP_PHONE }, select: { id: true, ownerId: true } })
  const shopIds = shops.map((s) => s.id)
  const ownerIds = shops.map((s) => s.ownerId)
  if (shopIds.length > 0) {
    await prisma.searchLog.deleteMany({ where: { lat: ANCHOR.lat, lng: ANCHOR.lng } })
    await prisma.availabilityEvent.deleteMany({ where: { shopId: { in: shopIds } } })
    const invRows = await prisma.shopInventory.findMany({ where: { shopId: { in: shopIds } }, select: { productId: true } })
    await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
    await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    const productIds = invRows.map((r) => r.productId)
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { categoryId: true } })
      await prisma.product.deleteMany({ where: { id: { in: productIds } } })
      await prisma.category.deleteMany({ where: { id: { in: products.map((p) => p.categoryId) } } })
    }
  }
  if (ownerIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: ownerIds } } })
}

describe('GET /api/search', () => {
  let originalWeights: Awaited<ReturnType<typeof getRankingWeights>>

  beforeAll(async () => {
    await clock.reset()
    await cleanup()
    originalWeights = await getRankingWeights()

    // Four shops near the anchor, all stocking a wheat-flour-like product
    // whose keywords include the literal spellings "atta"/"aata"/"ata" —
    // mirrors the real seed's Aashirvaad/Fortune/loose wheat flour rows,
    // but self-contained so this suite doesn't depend on `db:reset` output.
    await makeShopWithProduct({
      distanceMetres: 80, bearingDegrees: 10, keywords: ['atta', 'aata', 'ata', 'wheat flour'],
      productName: 'Fixture Aashirvaad Atta 5 kg', price: 285, availability: 'IN_STOCK', ageMinutes: 10,
    })
    await makeShopWithProduct({
      distanceMetres: 150, bearingDegrees: 90, keywords: ['atta', 'aata', 'ata', 'wheat flour'],
      productName: 'Fixture Fortune Atta 5 kg', price: 265, availability: 'IN_STOCK', ageMinutes: 300,
    })
    await makeShopWithProduct({
      distanceMetres: 300, bearingDegrees: 180, keywords: ['atta', 'aata', 'ata', 'wheat flour'],
      productName: 'Fixture Loose Wheat Flour', price: 45, availability: 'OUT_OF_STOCK', ageMinutes: 60,
    })
    await makeShopWithProduct({
      distanceMetres: 500, bearingDegrees: 270, keywords: ['atta', 'aata', 'ata', 'wheat flour'],
      productName: 'Fixture Multigrain Atta 5 kg', price: 310, availability: 'UNKNOWN', ageMinutes: 5,
    })
  })

  afterAll(async () => {
    await setRankingWeights(originalWeights)
    await cleanup()
    await prisma.$disconnect()
  })

  it('"atta" at the anchor returns at least 4 distinct shops', async () => {
    const res = await request(app).get('/api/search').query({ q: 'atta', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
    expect(res.status).toBe(200)
    const shopIds = new Set(res.body.results.map((r: { shopId: string }) => r.shopId))
    expect(shopIds.size).toBeGreaterThanOrEqual(4)
  })

  it('"aata" and "ata" return the same set of products', async () => {
    const aata = await request(app).get('/api/search').query({ q: 'aata', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
    const ata = await request(app).get('/api/search').query({ q: 'ata', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })

    const productIds = (res: request.Response) =>
      [...new Set(res.body.results.map((r: { product: { id: string } }) => r.product.id))].sort()

    expect(productIds(aata)).toEqual(productIds(ata))
    expect(productIds(aata).length).toBeGreaterThan(0)
  })

  it('results carry differing badges', async () => {
    const res = await request(app).get('/api/search').query({ q: 'atta', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
    const labels = new Set(res.body.results.map((r: { badge: { label: string } }) => r.badge.label))
    expect(labels.size).toBeGreaterThanOrEqual(2)
  })

  it('a zero-result query still writes a SearchLog row with resultCount: 0', async () => {
    const term = 'zznonexistentitemxyz'
    const res = await request(app).get('/api/search').query({ q: term, lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
    expect(res.status).toBe(200)
    expect(res.body.results).toEqual([])
    expect(res.body.total).toBe(0)

    const logs = await prisma.searchLog.findMany({ where: { queryText: term }, orderBy: { createdAt: 'desc' }, take: 1 })
    expect(logs.length).toBe(1)
    expect(logs[0].resultCount).toBe(0)

    await prisma.searchLog.deleteMany({ where: { queryText: term } })
  })

  it('never emits a numeric stock count', async () => {
    const res = await request(app).get('/api/search').query({ q: 'atta', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
    const raw = JSON.stringify(res.body)
    expect(raw).not.toMatch(/"stock(Count|Quantity)"/i)
  })

  describe('changing ranking weights changes result order', () => {
    it('a proximity-heavy config ranks the near shop first; a confidence-heavy config flips it', async () => {
      await cleanup() // tidy up the atta fixtures before adding this sub-test's own two shops
      const near = await makeShopWithProduct({
        distanceMetres: 5, bearingDegrees: 0, keywords: ['fixturerankitem'],
        productName: 'Fixture Rank Item Near', price: 10, availability: 'OUT_OF_STOCK', ageMinutes: 30,
      })
      const far = await makeShopWithProduct({
        distanceMetres: 900, bearingDegrees: 0, keywords: ['fixturerankitem'],
        productName: 'Fixture Rank Item Far', price: 10, availability: 'IN_STOCK', ageMinutes: 5,
      })

      await setRankingWeights({ availabilityConfidence: 0.05, proximity: 0.85, shopRating: 0.05, isOpenNow: 0.05 })
      const proximityHeavy = await request(app)
        .get('/api/search')
        .query({ q: 'fixturerankitem', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
      expect(proximityHeavy.body.results[0].shopId).toBe(near.shop.id)

      await setRankingWeights({ availabilityConfidence: 0.85, proximity: 0.05, shopRating: 0.05, isOpenNow: 0.05 })
      const confidenceHeavy = await request(app)
        .get('/api/search')
        .query({ q: 'fixturerankitem', lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })
      expect(confidenceHeavy.body.results[0].shopId).toBe(far.shop.id)
    })
  })
})
