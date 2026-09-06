import type { PrismaClient } from '@prisma/client'
import type { Rng } from './random'
import { CATEGORY_SEED } from './data/categories'
import { PRODUCT_SEED, STARTER_BY_TYPE } from './data/products'
import { placeholderSvgDataUri } from './placeholderImage'

export async function seedCatalogue(prisma: PrismaClient, rng: Rng) {
  const categoryIds: Record<string, string> = {}

  for (const top of CATEGORY_SEED) {
    const parent = await prisma.category.create({
      data: { name: top.name, nameGu: top.nameGu, slug: top.slug, iconName: top.iconName },
    })
    categoryIds[top.slug] = parent.id
    for (const child of top.children) {
      const created = await prisma.category.create({
        data: { name: child.name, nameGu: child.nameGu, slug: child.slug,
                iconName: child.iconName, parentId: parent.id },
      })
      categoryIds[child.slug] = created.id
    }
  }

  const productsByName: Record<string, { id: string; basePrice: number }> = {}
  for (const p of PRODUCT_SEED) {
    const categoryId = categoryIds[p.categorySlug]
    if (!categoryId) throw new Error(`Unknown category slug "${p.categorySlug}" for ${p.name}`)
    const created = await prisma.product.create({
      data: {
        name: p.name, nameGu: p.nameGu, brand: p.brand, categoryId,
        unitType: p.unitType, defaultUnitLabel: p.defaultUnitLabel,
        mrp: p.isLooseGood ? null : (p.mrp ?? null),
        barcode: p.barcode ?? null,
        imageUrl: placeholderSvgDataUri(p.name, rng.int(0, 359)),
        searchKeywords: p.searchKeywords,
        isLooseGood: p.isLooseGood ?? false,
      },
    })
    // One reference price per product. Shops vary from this by ±8% in
    // Task 8, so the same item costs roughly the same across the
    // neighbourhood — which is what makes price comparison meaningful.
    const basePrice = Number(
      (p.mrp ? p.mrp * 0.97 : rng.float(20, 220)).toFixed(2),
    )
    productsByName[p.name] = { id: created.id, basePrice }
  }

  for (const [shopType, names] of Object.entries(STARTER_BY_TYPE)) {
    for (const name of names) {
      const product = productsByName[name]
      if (!product) throw new Error(`Starter catalogue references unknown product "${name}"`)
      await prisma.starterCatalogueItem.create({
        data: {
          shopType: shopType as never,
          productId: product.id,
          suggestedPrice: product.basePrice,
        },
      })
    }
  }

  return { categoryIds, productsByName }
}
