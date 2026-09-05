import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'

async function clear() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
  )
}

describe('identity and geography schema', () => {
  beforeEach(clear)
  afterAll(async () => { await prisma.$disconnect() })

  it('allows one phone to hold both a customer and a merchant account', async () => {
    // Spec R7: registration is per-role, so the same human may sign up
    // twice — once to shop, once to sell.
    await prisma.user.create({
      data: { name: 'Asha', phone: '9000000001', role: 'CUSTOMER' },
    })
    const merchant = await prisma.user.create({
      data: { name: 'Asha', phone: '9000000001', role: 'MERCHANT', passwordHash: 'x' },
    })
    expect(merchant.id).toBeTruthy()
  })

  it('rejects two accounts with the same phone AND role', async () => {
    await prisma.user.create({
      data: { name: 'Asha', phone: '9000000002', role: 'CUSTOMER' },
    })
    await expect(
      prisma.user.create({
        data: { name: 'Imposter', phone: '9000000002', role: 'CUSTOMER' },
      }),
    ).rejects.toThrow()
  })

  it('enforces unique emails for admin accounts', async () => {
    await prisma.user.create({
      data: { name: 'Admin', phone: '9000000000', role: 'ADMIN',
              email: 'admin@shopnear.local', passwordHash: 'x' },
    })
    await expect(
      prisma.user.create({
        data: { name: 'Other', phone: '9000000009', role: 'ADMIN',
                email: 'admin@shopnear.local', passwordHash: 'x' },
      }),
    ).rejects.toThrow()
  })

  it('stores a shop geography point and measures distance from it', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Shreeji Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
        type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
        lat: 23.0365, lng: 72.5611, status: 'ACTIVE',
        openingHours: { mon: { open: '09:00', close: '21:00' }, isTemporarilyClosed: false },
      },
    })
    // Geography column is written separately — Prisma cannot type it.
    await prisma.$executeRaw`
      UPDATE "Shop"
      SET location = ST_SetSRID(ST_MakePoint(${shop.lng}, ${shop.lat}), 4326)::geography
      WHERE id = ${shop.id}
    `
    const rows = await prisma.$queryRaw<{ metres: number }[]>`
      SELECT ST_Distance(location, ST_MakePoint(72.5611, 23.0365)::geography) AS metres
      FROM "Shop" WHERE id = ${shop.id}
    `
    expect(rows[0].metres).toBeLessThan(1)
  })

  it('supports two-level category nesting', async () => {
    const parent = await prisma.category.create({
      data: { name: 'Groceries', nameGu: 'કરિયાણું', slug: 'groceries', iconName: 'basket' },
    })
    const child = await prisma.category.create({
      data: { name: 'Flours & Grains', nameGu: 'લોટ અને અનાજ', slug: 'flours-grains',
              iconName: 'wheat', parentId: parent.id },
    })
    expect(child.parentId).toBe(parent.id)
  })
})
