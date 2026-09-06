import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from './db'

async function seedShop() {
  const owner = await prisma.user.create({
    data: { name: 'Owner', phone: '9000000010', role: 'MERCHANT', passwordHash: 'x' },
  })
  return prisma.shop.create({
    data: {
      ownerId: owner.id, name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા',
      type: 'KIRANA', phone: '9000000010', address: 'Navrangpura',
      lat: 23.0365, lng: 72.5611, status: 'ACTIVE', openingHours: {},
    },
  })
}

async function seedProduct(name = 'Aashirvaad Atta 5 kg', barcode?: string) {
  const cat = await prisma.category.create({
    data: { name: 'Flours', nameGu: 'લોટ', slug: `flours-${Math.random()}`, iconName: 'wheat' },
  })
  return prisma.product.create({
    data: {
      name, nameGu: 'આશીર્વાદ લોટ', brand: 'Aashirvaad', categoryId: cat.id,
      unitType: 'WEIGHT', defaultUnitLabel: '5 kg', mrp: 285, barcode,
      searchKeywords: ['atta', 'aata', 'lot', 'ghau no lot', 'wheat flour'],
    },
  })
}

describe('catalogue and inventory schema', () => {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Shop", "Address", "User", "Category" RESTART IDENTITY CASCADE',
    )
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('stores search keywords as an array for transliteration matching', async () => {
    const p = await seedProduct()
    expect(p.searchKeywords).toContain('aata')
    expect(p.searchKeywords).toContain('ghau no lot')
  })

  it('allows loose goods to have no MRP and no barcode', async () => {
    const cat = await prisma.category.create({
      data: { name: 'Pulses', nameGu: 'કઠોળ', slug: 'pulses', iconName: 'lentil' },
    })
    const p = await prisma.product.create({
      data: { name: 'Toor Dal (loose)', nameGu: 'તુવેર દાળ', categoryId: cat.id,
              unitType: 'WEIGHT', defaultUnitLabel: 'per kg', isLooseGood: true,
              searchKeywords: ['toor dal', 'tuver dal', 'arhar'] },
    })
    expect(p.mrp).toBeNull()
    expect(p.barcode).toBeNull()
  })

  it('rejects a duplicate barcode', async () => {
    await seedProduct('Amul Butter 500 g', '8901262010016')
    await expect(seedProduct('amul butter 500 gm', '8901262010016')).rejects.toThrow()
  })

  it('rejects the same product listed twice in one shop', async () => {
    const shop = await seedShop()
    const product = await seedProduct()
    await prisma.shopInventory.create({
      data: { shopId: shop.id, productId: product.id, price: 279,
              availability: 'IN_STOCK', availabilitySource: 'SEED' },
    })
    await expect(
      prisma.shopInventory.create({
        data: { shopId: shop.id, productId: product.id, price: 281,
                availability: 'IN_STOCK', availabilitySource: 'SEED' },
      }),
    ).rejects.toThrow()
  })

  it('defaults availability to UNKNOWN with a timestamp', async () => {
    const shop = await seedShop()
    const product = await seedProduct()
    const inv = await prisma.shopInventory.create({
      data: { shopId: shop.id, productId: product.id, price: 279 },
    })
    expect(inv.availability).toBe('UNKNOWN')
    expect(inv.availabilityUpdatedAt).toBeInstanceOf(Date)
    expect(inv.confirmCount).toBe(0)
  })

  it('stores a starter catalogue entry per shop type', async () => {
    const product = await seedProduct()
    const item = await prisma.starterCatalogueItem.create({
      data: { shopType: 'KIRANA', productId: product.id, suggestedPrice: 279 },
    })
    expect(item.shopType).toBe('KIRANA')
  })

  it('finds wheat flour from the misspelling "ata" via trigram similarity', async () => {
    await seedProduct('Aashirvaad Atta 5 kg')
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM "Product"
      WHERE similarity(name, 'ata') > 0.1
      ORDER BY similarity(name, 'ata') DESC
    `
    expect(rows.length).toBeGreaterThan(0)
  })
})
