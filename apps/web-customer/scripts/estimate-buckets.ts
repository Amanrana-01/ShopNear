/**
 * Three-bucket coverage estimate, measured rather than guessed.
 *
 * Classifies the whole catalogue by policy, then runs the real matcher against
 * a sample of brands to measure the packshot hit rate on items that could
 * plausibly have one, and extrapolates from that. Sampled brands are cached,
 * so a second run costs no network at all.
 *
 *   npx tsx scripts/estimate-buckets.ts
 */
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCatalogue } from './lib/catalogue'
import { OffClient, type OffHost } from './lib/off'
import { bestMatch, buildBrandUniverse, type CatalogueItem } from './lib/match'
import { buildCategoryGenerics } from './lib/text'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Categories these databases genuinely carry. */
const FOOD = new Set([
  'flours-grains', 'pulses-dals', 'rice', 'edible-oils', 'spices-masala',
  'sugar-jaggery', 'milk-curd', 'butter-ghee', 'cheese-paneer', 'bread-buns',
  'biscuits-cookies', 'cakes-rusks', 'tea-coffee', 'soft-drinks',
  'juices-health-drinks', 'namkeen-chips', 'chocolates-candy',
  'instant-noodles', 'namkeen-farsan', 'sweets-mithai', 'nuts-seeds',
  'dried-fruits', 'cereals-flakes', 'jams-spreads', 'ice-cream',
  'frozen-snacks', 'fresh-vegetables', 'fresh-fruits',
])
const BEAUTY = new Set(['bath-soap', 'shampoo-haircare', 'oral-care'])
const WEAK = new Set(['cleaning-supplies', 'laundry', 'otc-medicines', 'first-aid'])

function hostsFor(categorySlug: string): OffHost[] {
  if (categorySlug === 'baby-care') return ['beauty', 'food', 'products']
  if (BEAUTY.has(categorySlug)) return ['beauty', 'products']
  if (FOOD.has(categorySlug)) return ['food']
  if (WEAK.has(categorySlug)) return ['products', 'food']
  return []
}

type Bucket = 'packshot-eligible' | 'generic-commodity' | 'placeholder-certain'

function bucketFor(item: CatalogueItem): Bucket {
  // Policy, in order. Unbranded first: a commodity has no brand to mismatch,
  // so a photograph of that commodity is correct rather than a fallback.
  if (!item.isBranded) return 'generic-commodity'
  if (hostsFor(item.categorySlug).length === 0) return 'placeholder-certain'
  return 'packshot-eligible'
}

const catalogue = loadCatalogue()
const brandUniverse = buildBrandUniverse(catalogue)
const categoryGenerics = buildCategoryGenerics(catalogue)

const byBucket = new Map<Bucket, CatalogueItem[]>()
for (const item of catalogue) {
  const b = bucketFor(item)
  const list = byBucket.get(b)
  if (list) list.push(item)
  else byBucket.set(b, [item])
}

const eligible = byBucket.get('packshot-eligible') ?? []
const generic = byBucket.get('generic-commodity') ?? []
const certain = byBucket.get('placeholder-certain') ?? []

console.log(`catalogue                 ${catalogue.length}`)
console.log(`  packshot-eligible       ${eligible.length}  (branded, in a covered trade)`)
console.log(`  generic-commodity       ${generic.length}  (unbranded - photo of the commodity is correct)`)
console.log(`  placeholder-certain     ${certain.length}  (branded, no such database exists)`)
console.log('')

// Measure the hit rate on the largest eligible brands.
const brandCounts = new Map<string, number>()
for (const i of eligible) brandCounts.set(i.brand!, (brandCounts.get(i.brand!) ?? 0) + 1)
const sampleBrands = [...brandCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, Number(process.argv[2] ?? 8))
  .map(([brand]) => brand)

const client = new OffClient({ cacheDir: join(HERE, '..', '.cache', 'off') })

let sampled = 0
let matched = 0
const groupsHit = new Set<string>()

for (const brand of sampleBrands) {
  const items = eligible.filter((i) => i.brand === brand)
  const hosts = [...new Set(items.flatMap((i) => hostsFor(i.categorySlug)))]
  let candidates = []
  for (const host of hosts) {
    try {
      candidates = candidates.concat(await client.searchByBrand(host, brand))
    } catch (err) {
      console.log(`  [${brand} @ ${host}] search failed: ${String(err).slice(0, 80)}`)
    }
  }

  let brandHits = 0
  for (const item of items) {
    sampled++
    const { accepted } = bestMatch(
      item, candidates, brandUniverse, categoryGenerics.get(item.categorySlug),
    )
    if (accepted) {
      matched++
      brandHits++
      groupsHit.add(item.variantGroupId)
    }
  }
  console.log(`  ${brand.padEnd(14)} ${String(brandHits).padStart(2)}/${String(items.length).padEnd(3)} matched  (${candidates.length} candidates)`)
}

const rate = sampled === 0 ? 0 : matched / sampled
console.log('')
console.log(`sample: ${matched}/${sampled} eligible items matched = ${(rate * 100).toFixed(0)}%`)
console.log('')
console.log('PROJECTED, whole catalogue:')
const projPack = Math.round(eligible.length * rate)
console.log(`  real packshot        ~${projPack}  (${((projPack / catalogue.length) * 100).toFixed(0)}%)`)
console.log(`  generic commodity     ${generic.length}  (${((generic.length / catalogue.length) * 100).toFixed(0)}%)  - needs a commodity photo source`)
console.log(`  placeholder          ~${catalogue.length - projPack - generic.length}  (${(((catalogue.length - projPack - generic.length) / catalogue.length) * 100).toFixed(0)}%)`)
