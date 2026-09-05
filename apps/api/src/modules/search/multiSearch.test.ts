import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import { createApp } from '../../app'
import { prisma } from '../../db'
import * as clock from '../../clock/clock'

const app = createApp()
const ANCHOR = { lat: 23.0365, lng: 72.5611 }
const SHOP_PHONE = '9166660099'

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

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

let counter = 0
async function makeShopStocking(distanceMetres: number, bearingDegrees: number, keywordSets: string[][]) {
  counter += 1
  const ownerPhone = `916666${String(9000 + counter).padStart(4, '0')}`
  const owner = await prisma.user.create({
    data: { name: 'Fixture Owner', phone: ownerPhone, role: 'MERCHANT', passwordHash: await argon2.hash('x') },
  })
  const { lat, lng } = offsetPoint(distanceMetres, bearingDegrees)
  const shop = await prisma.shop.create({
    data: {
      ownerId: owner.id, name: `MultiSearch Shop ${counter}`, nameGu: `MultiSearch Shop ${counter}`,
      type: 'KIRANA', phone: SHOP_PHONE, address: 'Fixture Address, Navrangpura',
      lat, lng, status: 'ACTIVE', openingHours: OPEN_ALL_DAY,
    },
  })
  await prisma.$executeRaw`
    UPDATE "Shop" SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography WHERE id = ${shop.id}
  `
  const category = await prisma.category.create({
    data: { name: 'MS Cat', nameGu: 'MS Cat', slug: `ms-cat-${shop.id}`, iconName: 'box' },
  })
  for (const keywords of keywordSets) {
    const product = await prisma.product.create({
      data: {
        name: `MS Product ${keywords[0]} ${shop.id}`, nameGu: keywords[0], categoryId: category.id,
        unitType: 'PIECE', defaultUnitLabel: '1 pc', searchKeywords: keywords,
      },
    })
    await prisma.shopInventory.create({
      data: {
        shopId: shop.id, productId: product.id, price: 20,
        availability: 'IN_STOCK', availabilityUpdatedAt: clock.now(), availabilitySource: 'SEED',
      },
    })
  }
  return { owner, shop }
}

async function cleanup() {
  const shops = await prisma.shop.findMany({ where: { phone: SHOP_PHONE }, select: { id: true, ownerId: true } })
  const shopIds = shops.map((s) => s.id)
  const ownerIds = shops.map((s) => s.ownerId)
  if (shopIds.length > 0) {
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
  await prisma.searchLog.deleteMany({ where: { queryText: { in: ['msatta', 'msdoodh', 'msmaggi', 'mssabun', 'msmissingitem'] } } })
}

const ITEMS = ['msatta', 'msdoodh', 'msmaggi', 'mssabun', 'msmissingitem']

describe('POST /api/search/multi', () => {
  let bestShopId: string
  let secondShopId: string

  beforeAll(async () => {
    await clock.reset()
    await cleanup()

    // Best shop: carries 3 of the 5 items (including one overlap with the
    // second shop, so the greedy split has something interesting to do).
    const best = await makeShopStocking(100, 20, [['msatta'], ['msdoodh'], ['msmaggi']])
    bestShopId = best.shop.id

    // Second shop: carries 2 items, one of which (msatta) the best shop
    // already covers, and one (mssabun) it doesn't.
    const second = await makeShopStocking(400, 200, [['msatta'], ['mssabun']])
    secondShopId = second.shop.id

    // 'msmissingitem' is deliberately stocked nowhere.
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('identifies the single best shop and lists the rest as missing', async () => {
    const res = await request(app)
      .post('/api/search/multi')
      .send({ items: ITEMS, lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })

    expect(res.status).toBe(200)
    expect(res.body.bestShop.shop.id).toBe(bestShopId)
    expect(new Set(res.body.bestShop.covered)).toEqual(new Set(['msatta', 'msdoodh', 'msmaggi']))
    expect(new Set(res.body.bestShop.missing)).toEqual(new Set(['mssabun', 'msmissingitem']))
  })

  it('the two-shop split covers at least as many items as the best single shop', async () => {
    const res = await request(app)
      .post('/api/search/multi')
      .send({ items: ITEMS, lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })

    const bestCoverage = res.body.bestShop.covered.length
    const splitCoverage = new Set(res.body.split.flatMap((s: { covered: string[] }) => s.covered)).size

    expect(splitCoverage).toBeGreaterThanOrEqual(bestCoverage)
    expect(res.body.split.length).toBe(2)
    expect(res.body.split[0].shop.id).toBe(bestShopId)
    expect(res.body.split[1].shop.id).toBe(secondShopId)
    expect(res.body.split[1].covered).toEqual(['mssabun'])
  })

  it('an item nobody stocks appears in missing and is logged as a zero-result search', async () => {
    const res = await request(app)
      .post('/api/search/multi')
      .send({ items: ITEMS, lat: ANCHOR.lat, lng: ANCHOR.lng, radius: 1000 })

    expect(res.body.bestShop.missing).toContain('msmissingitem')

    const logs = await prisma.searchLog.findMany({ where: { queryText: 'msmissingitem' } })
    expect(logs.length).toBeGreaterThanOrEqual(1)
    expect(logs[0].resultCount).toBe(0)
  })
})
