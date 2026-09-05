import type { Availability, AvailabilitySource, Offer, InventoryEntry } from '@shopnear/shared'
import { PRODUCTS, PRODUCT_BY_ID, basePriceFor } from './products'
import { SHOPS, SHOP_DETAILS } from './shops'
import { seededRandomFor, pick, sample } from './helpers'

/** A fixed "seed now" so relative badge ages ("confirmed 20 min ago") read
 * naturally regardless of when the demo is actually run — every reload
 * recomputes ages relative to Date.now(), so a shop's freshest confirmation
 * is always recent even hours after the app was started. */
const AGE_BUCKETS_MINUTES = [5, 20, 45, 90, 200, 600, 1_500, 4_000, 8_000, 13_000]

// A kirana/general store plausibly stocks nearly everything except the three
// specialist-only category groups below.
const SPECIALIST_ONLY_SLUGS = new Set([
  'notebooks-paper', 'pens-pencils', 'art-craft',
  'tools', 'electrical', 'paints',
  'otc-medicines', 'first-aid', 'baby-care',
])

const SPECIALIST_SLUGS: Record<string, string[]> = {
  STATIONERY: ['notebooks-paper', 'pens-pencils', 'art-craft'],
  HARDWARE: ['tools', 'electrical', 'paints'],
  CHEMIST: ['otc-medicines', 'first-aid', 'baby-care'],
  BAKERY: ['bread-buns', 'biscuits-cookies', 'cakes-rusks'],
  DAIRY: ['milk-curd', 'butter-ghee', 'cheese-paneer'],
}

/** Guaranteed present at every broad (kirana/general) shop, and biased
 * towards IN_STOCK/fresh so the multi-item search demo ("atta, doodh,
 * Maggi, sabun") reliably lands a strong single-shop match. */
const ESSENTIAL_NAMES = [
  'Aashirvaad Superior MP Atta 5 kg', 'Wheat Flour (loose)',
  'Amul Taaza Milk 500 ml', 'Milk (loose)',
  'Maggi 2-Minute Noodles 70 g', 'Nirma Bath Soap 100 g', 'Lifebuoy Soap 125 g',
  'Toor Dal (loose)', 'Amul Butter 500 g', 'Colgate Strong Teeth Toothpaste 200 g',
  'Surf Excel Easy Wash 1 kg', 'Parle-G Biscuits 200 g', 'Tata Salt 1 kg',
  'Tata Tea Gold 250 g', "Lay's Classic Salted 52 g", 'Onion Kanda (loose)',
  'Potato Batata (loose)', 'Tomato Tameta (loose)',
]

const UNIVERSAL_TAIL_NAMES = [
  'Parle-G Biscuits 200 g', 'Maggi 2-Minute Noodles 70 g', 'Tata Tea Gold 250 g',
  'Coca-Cola 750 ml', 'Cadbury Dairy Milk 55 g', 'Amul Taaza Milk 500 ml',
]

interface GeneratedRow { productId: string; shopId: string; price: number; availability: Availability; ageMinutes: number; source: AvailabilitySource }

const rows: GeneratedRow[] = []

for (const shop of SHOPS) {
  const rng = seededRandomFor(`${shop.id}:inventory`)
  const isBroad = shop.type === 'KIRANA' || shop.type === 'GENERAL'
  let chosenNames: Set<string>

  if (isBroad) {
    const pool = PRODUCTS.filter((p) => !SPECIALIST_ONLY_SLUGS.has(p.categorySlug ?? '')).map((p) => p.name)
    chosenNames = new Set(ESSENTIAL_NAMES)
    const remaining = pool.filter((n) => !chosenNames.has(n))
    const target = Math.min(pool.length, 90 + Math.floor(rng() * 40))
    for (const n of sample(rng, remaining, Math.max(0, target - chosenNames.size))) chosenNames.add(n)
  } else {
    const slugs = shop.type ? (SPECIALIST_SLUGS[shop.type] ?? []) : []
    const starterPool = PRODUCTS.filter((p) => slugs.includes(p.categorySlug ?? '')).map((p) => p.name)
    chosenNames = new Set(starterPool)
    for (const n of UNIVERSAL_TAIL_NAMES) if (rng() > 0.35) chosenNames.add(n)
  }

  for (const name of chosenNames) {
    const product = PRODUCTS.find((p) => p.name === name)
    if (!product) continue
    const isEssential = ESSENTIAL_NAMES.includes(name)
    const base = basePriceFor(product)
    const price = Number((base * (0.92 + rng() * 0.16)).toFixed(2))

    let availability: Availability
    let ageMinutes: number
    let source: AvailabilitySource = 'SEED'
    if (isEssential) {
      // Bias essentials toward fresh, confident stock so the headline demo
      // flows (search, multi-item search) look their best out of the box.
      availability = pick(rng, ['IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'USUALLY_AVAILABLE'] as const)
      ageMinutes = pick(rng, [5, 20, 45, 90, 200])
    } else {
      availability = pick(rng, [
        'IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'USUALLY_AVAILABLE', 'USUALLY_AVAILABLE',
        'OUT_OF_STOCK', 'UNKNOWN',
      ] as const)
      ageMinutes = pick(rng, AGE_BUCKETS_MINUTES)
    }
    if (availability === 'UNKNOWN') source = 'SEED'
    else if (rng() > 0.6) source = 'RESERVATION_CONFIRMED'

    rows.push({ productId: product.id, shopId: shop.id, price, availability, ageMinutes, source })
  }
}

/** Recomputed fresh on every module load (i.e. every page load) so
 * "confirmed N min ago" always reads as genuinely recent. */
function toOffer(row: GeneratedRow): Offer {
  const updatedAt = new Date(Date.now() - row.ageMinutes * 60_000)
  return {
    shopId: row.shopId,
    price: row.price,
    availability: row.availability,
    availabilityUpdatedAt: updatedAt.toISOString(),
    availabilitySource: row.source,
  }
}

export function offersForProduct(productId: string): Offer[] {
  return rows.filter((r) => r.productId === productId).map(toOffer)
}

export function offersForShop(shopId: string): InventoryEntry[] {
  return rows
    .filter((r) => r.shopId === shopId)
    .map((r) => ({ product: PRODUCT_BY_ID.get(r.productId)!, offer: toOffer(r) }))
    .filter((e) => e.product)
}

export function offerFor(shopId: string, productId: string): Offer | undefined {
  const row = rows.find((r) => r.shopId === shopId && r.productId === productId)
  return row ? toOffer(row) : undefined
}

// Backfill each shop's inventorySummary now that rows exist — mirrors the
// real API's GET /api/shops/:id response shape exactly (see
// apps/api/src/modules/shops/shops.service.ts#getShopDetail).
for (const shop of SHOPS) {
  const detail = SHOP_DETAILS.get(shop.id)
  if (!detail) continue
  const shopRows = rows.filter((r) => r.shopId === shop.id)
  const byAvailability: Record<string, number> = {}
  for (const r of shopRows) byAvailability[r.availability] = (byAvailability[r.availability] ?? 0) + 1
  detail.inventorySummary = { totalItems: shopRows.length, byAvailability }
}

export const ALL_ROWS = rows
