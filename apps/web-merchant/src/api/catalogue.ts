import { getShopsNearby, getAllShopInventory } from './client'
import type { Product } from './types'

/**
 * The API has no generic "browse the master Product catalogue" endpoint —
 * only per-shop inventory and the curated starter-catalogue list (see
 * `.superpowers/sdd/phase-2-tasks-5-7-report.md`: shops/search/merchants are
 * the full surface). Since this app must not modify `apps/api`, the
 * inventory-management "search products to add" and barcode-scan features
 * build their own product pool by aggregating every nearby shop's inventory
 * (which embeds the full `Product` row, barcode included) and de-duplicating
 * by product id. With 14 seeded shops of 9 different types across ~1,800
 * inventory rows this covers the ~342-product catalogue well in practice.
 *
 * A real production build would add `GET /api/products?query=` — flagged in
 * the phase report as a follow-up, not something this app can add itself.
 */
export interface ProductPool {
  products: Product[]
  byBarcode: Map<string, Product>
}

let cached: Promise<ProductPool> | null = null

export async function loadProductPool(anchorLat: number, anchorLng: number): Promise<ProductPool> {
  if (cached) return cached
  cached = (async () => {
    const shops = await getShopsNearby(anchorLat, anchorLng, 5000)
    const perShop = await Promise.all(
      shops.map((shop) => getAllShopInventory(shop.id).catch(() => [])),
    )
    const byId = new Map<string, Product>()
    for (const items of perShop) {
      for (const item of items) byId.set(item.productId, item.product)
    }
    const products = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
    const byBarcode = new Map<string, Product>()
    for (const p of products) if (p.barcode) byBarcode.set(p.barcode, p)
    return { products, byBarcode }
  })()
  return cached
}

export function resetProductPoolCache(): void {
  cached = null
}

export function searchProductPool(pool: ProductPool, query: string, limit = 60): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return pool.products.slice(0, limit)
  const scored = pool.products.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.nameGu.includes(query.trim()) ||
    p.brand?.toLowerCase().includes(q) ||
    p.searchKeywords.some((k) => k.toLowerCase().includes(q)),
  )
  return scored.slice(0, limit)
}
