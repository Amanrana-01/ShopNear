/**
 * Matcher sampler. Runs the real gates and scoring against a handful of items
 * and prints the full trace — what was considered, what was rejected and by
 * which gate — without downloading anything.
 *
 *   npx tsx scripts/sample-match.ts amul
 */
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCatalogue } from './lib/catalogue'
import { OffClient } from './lib/off'
import { bestMatch, buildBrandUniverse, CONFIDENCE_THRESHOLD } from './lib/match'
import { buildCategoryGenerics, distinctiveTokens } from './lib/text'

const HERE = dirname(fileURLToPath(import.meta.url))
const brandArg = process.argv[2] ?? 'amul'

const catalogue = loadCatalogue()
const brandUniverse = buildBrandUniverse(catalogue)
const categoryGenerics = buildCategoryGenerics(catalogue)
const items = catalogue
  .filter((i) => (i.brand ?? '').toLowerCase() === brandArg.toLowerCase())
  .slice(0, Number(process.argv[3] ?? 5))

if (items.length === 0) {
  console.error(`No catalogue items for brand "${brandArg}"`)
  process.exit(1)
}

const client = new OffClient({ cacheDir: join(HERE, '..', '.cache', 'off') })
const candidates = await client.searchByBrand('food', brandArg)

console.log(`brand "${brandArg}": ${candidates.length} Open Food Facts candidates`)
console.log(`threshold ${CONFIDENCE_THRESHOLD}\n`)

for (const item of items) {
  console.log('─'.repeat(78))
  console.log(`ITEM  ${item.name}`)
  console.log(`      group ${item.variantGroupId}`)
  console.log(`      needs [${distinctiveTokens(item.name, item.brand, categoryGenerics.get(item.categorySlug)).join(' ')}]`)

  const { accepted, considered } = bestMatch(
    item, candidates, brandUniverse, categoryGenerics.get(item.categorySlug),
  )

  if (accepted) {
    console.log(`  ACCEPTED  "${accepted.candidate.productName}"  [${accepted.candidate.code}]`)
    console.log(`            confidence ${accepted.confidence} — ${accepted.detail}`)
    console.log(`            ${accepted.candidate.imageUrl}`)
  } else {
    console.log('  NO MATCH — falls through to variant group, then placeholder')
  }

  // The near misses, so the gates are auditable rather than a black box.
  const nearMisses = considered
    .filter((v) => !v.accepted && v.reason !== 'brand-absent' && v.reason !== 'no-front-image')
    .slice(0, 4)
  for (const miss of nearMisses) {
    console.log(`  rejected  "${miss.candidate.productName}"`)
    console.log(`            ${miss.reason}: ${miss.detail}`)
  }
}
console.log('─'.repeat(78))
