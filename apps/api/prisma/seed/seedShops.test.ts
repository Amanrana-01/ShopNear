import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { seedUsersAndShops } from './seedShops'
import { ANCHOR, haversineMetres } from './geo'

let ctx: Awaited<ReturnType<typeof seedUsersAndShops>>

describe('users, shops, and inventory seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
    const rng = createRng(SEED)
    const catalogue = await seedCatalogue(prisma, rng)
    ctx = await seedUsersAndShops(prisma, rng, catalogue)
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates 1 admin, 12 merchants, and 8 customers', async () => {
    expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1)
    expect(await prisma.user.count({ where: { role: 'MERCHANT' } })).toBe(12)
    expect(await prisma.user.count({ where: { role: 'CUSTOMER' } })).toBe(8)
  })

  it('creates the documented demo accounts', async () => {
    const customer = await prisma.user.findFirst({ where: { phone: '9000000001', role: 'CUSTOMER' } })
    expect(customer).not.toBeNull()
    expect(customer!.passwordHash).toBeNull() // customers are OTP-only

    for (const phone of ['9000000010', '9000000011']) {
      const merchant = await prisma.user.findFirst({ where: { phone, role: 'MERCHANT' } })
      expect(merchant, `missing merchant ${phone}`).not.toBeNull()
      expect(merchant!.passwordHash).not.toBeNull()
    }

    const admin = await prisma.user.findFirst({ where: { email: 'admin@shopnear.local' } })
    expect(admin?.role).toBe('ADMIN')
  })

  it('creates 14 shops with the documented type mix', async () => {
    expect(await prisma.shop.count()).toBe(14)
    expect(await prisma.shop.count({ where: { type: 'KIRANA' } })).toBe(5)
    expect(await prisma.shop.count({ where: { type: 'GENERAL' } })).toBe(2)
    for (const type of ['STATIONERY', 'HARDWARE', 'CHEMIST', 'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE'] as const) {
      expect(await prisma.shop.count({ where: { type } }), type).toBe(1)
    }
  })

  it('leaves two shops pending and one suspended, so admin queues are not empty', async () => {
    expect(await prisma.shop.count({ where: { status: 'PENDING' } })).toBe(2)
    expect(await prisma.shop.count({ where: { status: 'SUSPENDED' } })).toBe(1)
    expect(await prisma.shop.count({ where: { status: 'ACTIVE' } })).toBe(11)
  })

  it('places at least three shops within 150 m of the default customer address', async () => {
    const shops = await prisma.shop.findMany({ select: { name: true, lat: true, lng: true } })
    const near = shops.filter(
      (s) => haversineMetres(ctx.defaultCustomerAddress.lat, ctx.defaultCustomerAddress.lng, s.lat, s.lng) <= 150,
    )
    expect(near.length, `only ${near.length} shops within 150 m`).toBeGreaterThanOrEqual(3)
  })

  it('scatters every shop between 40 m and 2.5 km of the anchor', async () => {
    const shops = await prisma.shop.findMany({ select: { name: true, lat: true, lng: true } })
    for (const s of shops) {
      const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, s.lat, s.lng)
      expect(d, `${s.name} at ${Math.round(d)} m`).toBeGreaterThanOrEqual(40)
      expect(d, `${s.name} at ${Math.round(d)} m`).toBeLessThanOrEqual(2500)
    }
  })

  it('populates the PostGIS location column for every shop', async () => {
    const rows = await prisma.$queryRaw<{ missing: bigint }[]>`
      SELECT COUNT(*) AS missing FROM "Shop" WHERE location IS NULL
    `
    expect(Number(rows[0].missing)).toBe(0)
  })

  it('keeps the geography column consistent with lat/lng', async () => {
    const rows = await prisma.$queryRaw<{ drift: number }[]>`
      SELECT MAX(ST_Distance(location, ST_MakePoint(lng, lat)::geography)) AS drift FROM "Shop"
    `
    expect(rows[0].drift).toBeLessThan(1)
  })

  it('creates roughly 1,800 inventory rows, 80-200 per shop', async () => {
    const total = await prisma.shopInventory.count()
    expect(total).toBeGreaterThanOrEqual(1500)
    expect(total).toBeLessThanOrEqual(2100)

    const grouped = await prisma.shopInventory.groupBy({ by: ['shopId'], _count: true })
    for (const g of grouped) {
      expect(g._count).toBeGreaterThanOrEqual(80)
      expect(g._count).toBeLessThanOrEqual(200)
    }
  })

  it('varies prices between shops by roughly ±8%, not randomly', async () => {
    // Spec §11: the same product should be comparable across shops, so the
    // spread must be non-zero but bounded — otherwise price comparison in
    // the customer UI is meaningless.
    const rows = await prisma.$queryRaw<{ ratio: number }[]>`
      SELECT MAX(price) / NULLIF(MIN(price), 0) AS ratio
      FROM "ShopInventory"
      GROUP BY "productId"
      HAVING COUNT(*) > 3
      ORDER BY ratio DESC
      LIMIT 1
    `
    expect(rows[0].ratio).toBeGreaterThan(1)      // shops do differ
    expect(rows[0].ratio).toBeLessThan(1.2)       // 1.08 / 0.92 ≈ 1.174
  })

  it('produces every availability state so all four badges appear', async () => {
    const grouped = await prisma.shopInventory.groupBy({ by: ['availability'], _count: true })
    const states = grouped.map((g) => g.availability).sort()
    expect(states).toEqual(['IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN', 'USUALLY_AVAILABLE'])
    for (const g of grouped) expect(g._count).toBeGreaterThan(20)
  })

  it('spreads availability timestamps from minutes to about nine days old', async () => {
    // Spec §7 has age-dependent badges; the seed must exercise each bucket.
    const rows = await prisma.$queryRaw<{ bucket: string; n: bigint }[]>`
      SELECT CASE
        WHEN "availabilityUpdatedAt" > NOW() - INTERVAL '2 hours'  THEN 'fresh'
        WHEN "availabilityUpdatedAt" > NOW() - INTERVAL '24 hours' THEN 'recent'
        ELSE 'stale'
      END AS bucket, COUNT(*) AS n
      FROM "ShopInventory" GROUP BY 1
    `
    const buckets = Object.fromEntries(rows.map((r) => [r.bucket, Number(r.n)]))
    expect(buckets.fresh ?? 0).toBeGreaterThan(20)
    expect(buckets.recent ?? 0).toBeGreaterThan(20)
    expect(buckets.stale ?? 0).toBeGreaterThan(20)
  })

  it('gives Shreeji Kirana to merchant 9000000010, within 150 m of home', async () => {
    // The demo script names this shop explicitly — keep it stable.
    const owner = await prisma.user.findFirst({ where: { phone: '9000000010', role: 'MERCHANT' } })
    const shop = await prisma.shop.findFirst({ where: { ownerId: owner!.id } })
    expect(shop!.name).toBe('Shreeji Kirana')
    expect(shop!.status).toBe('ACTIVE')
    const d = haversineMetres(
      ctx.defaultCustomerAddress.lat, ctx.defaultCustomerAddress.lng, shop!.lat, shop!.lng,
    )
    expect(d).toBeLessThan(150)
  })
})
