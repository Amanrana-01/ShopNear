import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { createRng, SEED } from './random'
import { seedCatalogue } from './seedCatalogue'
import { PRODUCT_SEED } from './data/products'
import { CATEGORY_SEED } from './data/categories'

describe('catalogue seed', () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "StarterCatalogueItem", "ShopInventory", "Product", "Category" RESTART IDENTITY CASCADE',
    )
    await seedCatalogue(prisma, createRng(SEED))
  })
  afterAll(async () => { await prisma.$disconnect() })

  it('creates roughly 40 categories across two levels', async () => {
    const total = await prisma.category.count()
    expect(total).toBeGreaterThanOrEqual(35)
    expect(total).toBeLessThanOrEqual(50)
    const children = await prisma.category.count({ where: { parentId: { not: null } } })
    expect(children).toBeGreaterThan(20)
  })

  it('never nests categories more than two levels deep', async () => {
    const children = await prisma.category.findMany({
      where: { parentId: { not: null } },
      include: { parent: true },
    })
    for (const c of children) expect(c.parent?.parentId).toBeNull()
  })

  it('creates roughly 350 products', async () => {
    const count = await prisma.product.count()
    expect(count).toBeGreaterThanOrEqual(330)
    expect(count).toBeLessThanOrEqual(380)
  })

  it('gives every product at least two search keywords', async () => {
    const products = await prisma.product.findMany({ select: { name: true, searchKeywords: true } })
    const thin = products.filter((p) => p.searchKeywords.length < 2)
    expect(thin, `products with too few keywords: ${thin.map((p) => p.name).join(', ')}`).toHaveLength(0)
  })

  it('gives every product a local placeholder image, never a remote URL', async () => {
    const remote = await prisma.product.count({ where: { imageUrl: { startsWith: 'http' } } })
    expect(remote).toBe(0)
  })

  it('leaves MRP null for loose goods only', async () => {
    const loose = await prisma.product.findMany({ where: { isLooseGood: true } })
    expect(loose.length).toBeGreaterThan(10)
    for (const p of loose) expect(p.mrp).toBeNull()
  })

  it('includes wheat flour reachable by Gujarati and Hindi transliterations', async () => {
    const atta = await prisma.product.findFirst({ where: { searchKeywords: { has: 'ghau no lot' } } })
    expect(atta).not.toBeNull()
    expect(atta!.searchKeywords).toContain('atta')
    expect(atta!.searchKeywords).toContain('aata')
  })

  it('stocks non-grocery products for the hardware, stationery, and chemist shops', async () => {
    for (const slug of ['hardware', 'stationery', 'chemist']) {
      const cat = await prisma.category.findFirst({ where: { slug } })
      expect(cat, `missing category ${slug}`).not.toBeNull()
      const count = await prisma.product.count({
        where: { category: { OR: [{ id: cat!.id }, { parentId: cat!.id }] } },
      })
      expect(count, `too few ${slug} products`).toBeGreaterThan(10)
    }
  })

  it('seeds a starter catalogue of about 60 items for kirana shops', async () => {
    const count = await prisma.starterCatalogueItem.count({ where: { shopType: 'KIRANA' } })
    expect(count).toBeGreaterThanOrEqual(50)
    expect(count).toBeLessThanOrEqual(70)
  })

  it('seeds a starter catalogue for every shop type', async () => {
    const grouped = await prisma.starterCatalogueItem.groupBy({
      by: ['shopType'], _count: true,
    })
    expect(grouped).toHaveLength(9)
    for (const g of grouped) expect(g._count).toBeGreaterThan(10)
  })

  it('has no duplicate barcodes in the source data', () => {
    const barcodes = PRODUCT_SEED.map((p) => p.barcode).filter(Boolean)
    expect(new Set(barcodes).size).toBe(barcodes.length)
  })

  it('references only category slugs that exist in the source data', () => {
    const slugs = new Set<string>()
    for (const c of CATEGORY_SEED) {
      slugs.add(c.slug)
      for (const child of c.children) slugs.add(child.slug)
    }
    const orphans = PRODUCT_SEED.filter((p) => !slugs.has(p.categorySlug))
    expect(orphans.map((p) => p.name)).toEqual([])
  })
})
