import type { Availability, AvailabilitySource, Offer, InventoryEntry, ShopType, Product } from '@shopnear/shared'
import { PRODUCTS, PRODUCT_BY_ID, basePriceFor } from './products'
import { SHOPS, SHOP_DETAILS } from './shops'
import { seededRandomFor, pick, sample } from './helpers'

/** A fixed "seed now" so relative badge ages ("confirmed 20 min ago") read
 * naturally regardless of when the demo is actually run — every reload
 * recomputes ages relative to Date.now(), so a shop's freshest confirmation
 * is always recent even hours after the app was started. */
const AGE_BUCKETS_MINUTES = [5, 20, 45, 90, 200, 600, 1_500, 4_000, 8_000, 13_000]

/** Smallest catalogue any shop may have. A specialist with twenty items reads
 * as a stub; forty is where a shop page starts needing its second page. */
const MIN_CATALOGUE = 40
/** Upper end of the *floor* range — a specialist whose own shelves are
 * thinner than this is topped up to somewhere in 40–50, chosen per shop so
 * they don't all land on the same number. Shops whose own shelves are
 * already deeper (a chemist, a kirana) keep everything they stock: 40–50 is
 * a floor, not a cap. */
const MAX_TOPPED_UP_CATALOGUE = 50

// A kirana/general store plausibly stocks nearly everything except the three
// specialist-only category groups below.
const SPECIALIST_ONLY_SLUGS = new Set([
  'notebooks-paper', 'pens-pencils', 'art-craft',
  'tools', 'electrical', 'paints',
  'otc-medicines', 'first-aid', 'baby-care',
])

/** Every non-broad shop type gets the full catalogue for the categories it
 * actually specialises in, so tapping "Bakery → Cakes & Rusks" at a bakery
 * shows the whole shelf rather than a lucky sample. */
const SPECIALIST_SLUGS: Partial<Record<ShopType, string[]>> = {
  STATIONERY: ['notebooks-paper', 'pens-pencils', 'art-craft'],
  HARDWARE: ['tools', 'electrical', 'paints'],
  CHEMIST: ['otc-medicines', 'first-aid', 'baby-care', 'oral-care', 'bath-soap', 'shampoo-haircare'],
  BAKERY: ['bread-buns', 'biscuits-cookies', 'cakes-rusks'],
  DAIRY: ['milk-curd', 'butter-ghee', 'cheese-paneer', 'ice-cream'],
  FARSAN: ['namkeen-farsan', 'sweets-mithai', 'namkeen-chips'],
  VEGETABLE: ['fresh-vegetables', 'fresh-fruits'],
}

/** What a specialist keeps by the till beyond its own trade — the school
 * stationery shop with a chocolate box, the sabjiwala with a masala rack.
 * Only drawn on when a shop's own shelves fall short of MIN_CATALOGUE, so
 * the top-up looks like a real counter rather than random padding. */
const ADJACENT_SLUGS: Partial<Record<ShopType, string[]>> = {
  STATIONERY: ['chocolates-candy', 'namkeen-chips', 'soft-drinks', 'biscuits-cookies'],
  HARDWARE: ['cleaning-supplies', 'kitchen-tools', 'storage-containers', 'pooja-items'],
  CHEMIST: ['juices-health-drinks', 'cereals-flakes', 'soft-drinks'],
  BAKERY: ['milk-curd', 'butter-ghee', 'tea-coffee', 'jams-spreads', 'chocolates-candy'],
  DAIRY: ['bread-buns', 'jams-spreads', 'juices-health-drinks', 'frozen-snacks'],
  FARSAN: ['biscuits-cookies', 'instant-noodles', 'soft-drinks', 'tea-coffee'],
  VEGETABLE: ['nuts-seeds', 'dried-fruits', 'spices-masala', 'flours-grains', 'pulses-dals'],
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
  'Bisleri Soda 750 ml', 'Kurkure Masala Munch 90 g',
]

/**
 * A shop's standing price position, 0 (keenest in the neighbourhood) to 1
 * (dearest). Held per shop rather than rolled per line, because a shop that
 * is cheap on atta and dear on dal is noise — a shop that is *consistently*
 * a few rupees under the one across the road is a reason to walk there, and
 * that is the comparison the whole app exists to make.
 */
const PRICE_INDEX_BY_SHOP = (() => {
  const byType = new Map<ShopType | 'UNKNOWN', { id: string; roll: number }[]>()
  for (const s of SHOPS) {
    const key = s.type ?? 'UNKNOWN'
    const entry = { id: s.id, roll: seededRandomFor(`${s.id}:price-index`)() }
    const list = byType.get(key)
    if (list) list.push(entry)
    else byType.set(key, [entry])
  }

  // Ranked, not raw. A raw roll clumps: draw fourteen hardware shops and they
  // can all land between 0.4 and 0.6, so a tin of paint costs about the same
  // everywhere and the "compare prices" screen has nothing to show. Ranking
  // within each trade spreads that trade's shops evenly from keenest to
  // dearest, which is what puts a real gap between the cheapest and dearest
  // offer on *every* product, specialist lines included.
  const out = new Map<string, number>()
  for (const list of byType.values()) {
    list.sort((a, b) => a.roll - b.roll)
    for (let i = 0; i < list.length; i++) {
      out.set(list[i].id, list.length === 1 ? 0.5 : i / (list.length - 1))
    }
  }
  return out
})()

const round2 = (n: number) => Number(n.toFixed(2))

/**
 * What one shop charges for one product.
 *
 * Branded goods are discounted *off MRP* — never above it, which is both the
 * law and the reason a printed MRP is worth showing — by up to ~21%. Loose
 * goods have no MRP, so they swing around a market rate instead. Either way
 * the keenest and dearest shop in range end up 25–30% apart, which is what
 * makes "save ₹34 by choosing the right shop" a real sentence.
 */
function priceFor(
  product: Product, priceIndex: number, rng: () => number,
): { price: number; discountPct: number | null } {
  const jitter = (rng() - 0.5) * 0.04
  if (product.mrp) {
    const discount = Math.min(0.25, Math.max(0, 0.02 + 0.20 * (1 - priceIndex) + jitter))
    return { price: round2(product.mrp * (1 - discount)), discountPct: Math.round(discount * 100) }
  }
  const factor = 0.89 + 0.23 * priceIndex + jitter
  return { price: round2(basePriceFor(product) * factor), discountPct: null }
}

/** Roughly one line in twelve is out of stock, and one in ten has gone stale
 * enough that the shop won't vouch for it. Without both, the out-of-stock and
 * "ask the shop" states never render outside a unit test. */
function availabilityFor(isEssential: boolean, rng: () => number): Availability {
  if (isEssential) {
    return pick(rng, ['IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'USUALLY_AVAILABLE'] as const)
  }
  const roll = rng()
  if (roll < 0.08) return 'OUT_OF_STOCK'
  if (roll < 0.18) return 'UNKNOWN'
  if (roll < 0.38) return 'USUALLY_AVAILABLE'
  return 'IN_STOCK'
}

/** Quantity on the shelf. Deliberately internal to this file — the contract
 * in packages/shared never exposes a stock number (see the design note at the
 * top of contracts.ts); it exists here because it is what `availability`
 * actually means, and because the join row the app models is a ShopItem. */
function stockQtyFor(availability: Availability, rng: () => number): number | null {
  if (availability === 'OUT_OF_STOCK') return 0
  if (availability === 'UNKNOWN') return null
  return 2 + Math.floor(rng() * 60)
}

/** One row of the shop↔product join — the ShopItem the app is modelled on. */
interface GeneratedRow {
  productId: string
  shopId: string
  price: number
  discountPct: number | null
  stockQty: number | null
  availability: Availability
  ageMinutes: number
  source: AvailabilitySource
}

const rows: GeneratedRow[] = []
const PRODUCT_BY_NAME = new Map(PRODUCTS.map((p) => [p.name, p]))
const PRODUCTS_BY_SLUG = new Map<string, Product[]>()
for (const p of PRODUCTS) {
  const slug = p.categorySlug ?? ''
  const list = PRODUCTS_BY_SLUG.get(slug)
  if (list) list.push(p)
  else PRODUCTS_BY_SLUG.set(slug, [p])
}
const productsForSlugs = (slugs: string[]): Product[] =>
  slugs.flatMap((s) => PRODUCTS_BY_SLUG.get(s) ?? [])

function makeRow(product: Product, shopId: string, rng: () => number, isEssential: boolean): GeneratedRow {
  const { price, discountPct } = priceFor(product, PRICE_INDEX_BY_SHOP.get(shopId) ?? 0.5, rng)
  const availability = availabilityFor(isEssential, rng)
  return {
    productId: product.id,
    shopId,
    price,
    discountPct,
    stockQty: stockQtyFor(availability, rng),
    availability,
    ageMinutes: isEssential ? pick(rng, [5, 20, 45, 90, 200]) : pick(rng, AGE_BUCKETS_MINUTES),
    source: availability === 'UNKNOWN' ? 'SEED' : rng() > 0.6 ? 'RESERVATION_CONFIRMED' : 'SEED',
  }
}

for (const shop of SHOPS) {
  const rng = seededRandomFor(`${shop.id}:inventory`)
  const isBroad = shop.type === 'KIRANA' || shop.type === 'GENERAL'
  const chosen: Product[] = []
  const chosenIds = new Set<string>()
  const add = (p: Product) => {
    if (chosenIds.has(p.id)) return
    chosenIds.add(p.id)
    chosen.push(p)
  }

  if (isBroad) {
    for (const name of ESSENTIAL_NAMES) {
      const p = PRODUCT_BY_NAME.get(name)
      if (p) add(p)
    }
    const pool = PRODUCTS.filter((p) => !SPECIALIST_ONLY_SLUGS.has(p.categorySlug ?? ''))
    // ~60-80% of the broad catalogue per shop: dense enough that any category
    // a customer opens has stock at several nearby shops, sparse enough that
    // price/availability still genuinely differ between them.
    const target = Math.floor(pool.length * (0.6 + rng() * 0.2))
    for (const p of sample(rng, pool.filter((p) => !chosenIds.has(p.id)), Math.max(0, target - chosen.length))) {
      add(p)
    }
  } else {
    // The whole of its own trade, always — that is what makes a bakery's
    // "Cakes & Rusks" chip show the full shelf and not a sample of it.
    for (const p of productsForSlugs(shop.type ? SPECIALIST_SLUGS[shop.type] ?? [] : [])) add(p)
    for (const name of UNIVERSAL_TAIL_NAMES) {
      const p = PRODUCT_BY_NAME.get(name)
      if (p && rng() > 0.35) add(p)
    }
    // Top up from the counter lines until the shop clears the floor.
    const floor = MIN_CATALOGUE + Math.floor(rng() * (MAX_TOPPED_UP_CATALOGUE - MIN_CATALOGUE + 1))
    if (chosen.length < floor) {
      const adjacent = productsForSlugs(shop.type ? ADJACENT_SLUGS[shop.type] ?? [] : [])
        .filter((p) => !chosenIds.has(p.id))
      for (const p of sample(rng, adjacent, floor - chosen.length)) add(p)
    }
    // Still short (a very small trade with a thin adjacency): fall back to the
    // general shelf so no shop page can ever render under MIN_CATALOGUE.
    if (chosen.length < MIN_CATALOGUE) {
      const general = PRODUCTS
        .filter((p) => !SPECIALIST_ONLY_SLUGS.has(p.categorySlug ?? '') && !chosenIds.has(p.id))
      for (const p of sample(rng, general, MIN_CATALOGUE - chosen.length)) add(p)
    }
  }

  for (const product of chosen) {
    rows.push(makeRow(product, shop.id, rng, ESSENTIAL_NAMES.includes(product.name)))
  }
}

// ---------------------------------------------------------------------------
// Coverage repair
//
// Generation is per shop, so nothing in it guarantees anything per *product* —
// a long-tail SKU can come out stocked by two shops on the far side of the
// radius, and the product page it lands on ("2 shops nearby carry this") is
// the thinnest screen in the app.
//
// This pass walks every product and tops it up until it is carried by at
// least MIN_SHOPS_PER_PRODUCT shops inside the default radius, at least one
// of them close by. Candidates are restricted to shops whose trade actually
// covers the product's category, so the repair never puts paint thinner in a
// dairy.
//
// Distances here are measured from the fixture ANCHOR, which is where the
// location presets put the customer; a customer who drags the pin elsewhere
// gets whatever is genuinely near them, as they should.
// ---------------------------------------------------------------------------

const DEFAULT_RADIUS_M = 1000
const NEARBY_RADIUS_M = 500
const MIN_SHOPS_PER_PRODUCT = 6
const MIN_NEARBY_SHOPS_PER_PRODUCT = 1

/** Shop types whose trade covers a given category slug. */
const TYPES_FOR_SLUG = new Map<string, ShopType[]>()
for (const [type, slugs] of Object.entries(SPECIALIST_SLUGS) as [ShopType, string[]][]) {
  for (const slug of slugs) {
    const list = TYPES_FOR_SLUG.get(slug)
    if (list) list.push(type)
    else TYPES_FOR_SLUG.set(slug, [type])
  }
}
function typesCarrying(slug: string): Set<ShopType> {
  const types = new Set<ShopType>(TYPES_FOR_SLUG.get(slug) ?? [])
  if (!SPECIALIST_ONLY_SLUGS.has(slug)) {
    types.add('KIRANA')
    types.add('GENERAL')
  }
  return types
}

{
  const distanceById = new Map(SHOPS.map((s) => [s.id, s.distanceMeters]))
  // Only shops inside the default radius can repair coverage, so the
  // candidate list is built once and filtered per product by trade.
  const inRangeByDistance = SHOPS
    .filter((s) => s.distanceMeters <= DEFAULT_RADIUS_M && s.type)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)

  const carriedBy = new Map<string, Set<string>>()
  for (const r of rows) {
    const set = carriedBy.get(r.productId)
    if (set) set.add(r.shopId)
    else carriedBy.set(r.productId, new Set([r.shopId]))
  }

  for (const product of PRODUCTS) {
    const have = carriedBy.get(product.id) ?? new Set<string>()
    // Counts are tracked incrementally rather than recomputed — this loop
    // runs at module load in the browser, over ~500 products.
    let inRange = 0
    let nearby = 0
    for (const shopId of have) {
      const d = distanceById.get(shopId)
      if (d === undefined || d > DEFAULT_RADIUS_M) continue
      inRange++
      if (d <= NEARBY_RADIUS_M) nearby++
    }
    if (inRange >= MIN_SHOPS_PER_PRODUCT && nearby >= MIN_NEARBY_SHOPS_PER_PRODUCT) {
      carriedBy.set(product.id, have)
      continue
    }

    const rng = seededRandomFor(`${product.id}:repair`)
    const eligible = typesCarrying(product.categorySlug ?? '')
    const isEssential = ESSENTIAL_NAMES.includes(product.name)
    const candidates = inRangeByDistance.filter((s) => eligible.has(s.type!) && !have.has(s.id))

    // Nearest first, so a repaired product looks like it was always stocked
    // down the road rather than bolted onto the edge of the radius. The
    // close-by requirement is satisfied first, since only the head of the
    // list can satisfy it at all.
    for (const shop of candidates) {
      const needNearby = nearby < MIN_NEARBY_SHOPS_PER_PRODUCT && shop.distanceMeters <= NEARBY_RADIUS_M
      const needMore = inRange < MIN_SHOPS_PER_PRODUCT
      if (!needNearby && !needMore) break
      rows.push(makeRow(product, shop.id, rng, isEssential))
      have.add(shop.id)
      inRange++
      if (shop.distanceMeters <= NEARBY_RADIUS_M) nearby++
    }
    carriedBy.set(product.id, have)
  }
}

// ---------------------------------------------------------------------------
// Indices. The fixture grew from ~1k rows to well over 20k when the catalogue
// and shop list were expanded for demo density, and every search groups offers
// per product — a linear scan per product turned that into an O(products ×
// rows) pass on every keystroke. These maps keep each lookup O(1).
// ---------------------------------------------------------------------------

const ROWS_BY_PRODUCT = new Map<string, GeneratedRow[]>()
const ROWS_BY_SHOP = new Map<string, GeneratedRow[]>()
const ROW_BY_SHOP_PRODUCT = new Map<string, GeneratedRow>()

for (const r of rows) {
  const byProduct = ROWS_BY_PRODUCT.get(r.productId)
  if (byProduct) byProduct.push(r)
  else ROWS_BY_PRODUCT.set(r.productId, [r])

  const byShop = ROWS_BY_SHOP.get(r.shopId)
  if (byShop) byShop.push(r)
  else ROWS_BY_SHOP.set(r.shopId, [r])

  ROW_BY_SHOP_PRODUCT.set(`${r.shopId}|${r.productId}`, r)
}

/** Recomputed fresh on every module load (i.e. every page load) so
 * "confirmed N min ago" always reads as genuinely recent. */
function toOffer(row: GeneratedRow): Offer {
  const updatedAt = new Date(Date.now() - row.ageMinutes * 60_000)
  return {
    shopId: row.shopId,
    price: row.price,
    discountPct: row.discountPct,
    availability: row.availability,
    availabilityUpdatedAt: updatedAt.toISOString(),
    availabilitySource: row.source,
  }
}

export function offersForProduct(productId: string): Offer[] {
  return (ROWS_BY_PRODUCT.get(productId) ?? []).map(toOffer)
}

export function offersForShop(shopId: string): InventoryEntry[] {
  return (ROWS_BY_SHOP.get(shopId) ?? [])
    .map((r) => ({ product: PRODUCT_BY_ID.get(r.productId)!, offer: toOffer(r) }))
    .filter((e) => e.product)
}

export function offerFor(shopId: string, productId: string): Offer | undefined {
  const row = ROW_BY_SHOP_PRODUCT.get(`${shopId}|${productId}`)
  return row ? toOffer(row) : undefined
}

/** Shop ids that carry a given product, without materialising Offer objects —
 * used by the "N shops nearby" counts on dense grids. */
export function shopIdsForProduct(productId: string): string[] {
  return (ROWS_BY_PRODUCT.get(productId) ?? []).map((r) => r.shopId)
}

// Backfill each shop's inventorySummary now that rows exist — mirrors the
// real API's GET /api/shops/:id response shape exactly (see
// apps/api/src/modules/shops/shops.service.ts#getShopDetail).
for (const shop of SHOPS) {
  const detail = SHOP_DETAILS.get(shop.id)
  if (!detail) continue
  const shopRows = ROWS_BY_SHOP.get(shop.id) ?? []
  const byAvailability: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  for (const r of shopRows) {
    byAvailability[r.availability] = (byAvailability[r.availability] ?? 0) + 1
    const slug = PRODUCT_BY_ID.get(r.productId)?.categorySlug
    if (slug) byCategory[slug] = (byCategory[slug] ?? 0) + 1
  }
  detail.inventorySummary = { totalItems: shopRows.length, byAvailability, byCategory }
}

export const ALL_ROWS = rows
