/** Shared text normalisation for catalogue matching. No dependencies. */

/**
 * Lowercase, de-accented, punctuation-free.
 *
 * The de-accenting is not cosmetic. Open Food Facts writes the brand as
 * "Nestle" with an acute e; stripping non-ASCII without decomposing first
 * turned that into "nestl", which never equalled our "nestle" - so the brand
 * gate rejected all 112 Nestle records and the brand scored a flat zero. Any
 * brand with a diacritic fails the same way.
 */
export const norm = (s: string | null | undefined): string =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export const tokens = (s: string | null | undefined): string[] =>
  norm(s).split(' ').filter(Boolean)

/** Pack sizes, in every shape this catalogue writes them. */
const SIZE_PATTERNS: RegExp[] = [
  /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|mg|ml|l|ltr|litre|liter)\b/g,
  /\b\d+\s*(?:pc|pcs|piece|pieces|sheets|sheet|shades|tab|tabs|tablets|pg|n|nos)\b/g,
  /\b\d+\s*(?:cm|mm|inch|in|sq\s*mm|m)\b/g,
  /\bpack\s+of\s+\d+\b/g,
  /\b\d+\s*x\s*\d+\b/g,
]

/**
 * Like `norm`, but keeps the decimal point inside numbers.
 *
 * `norm` turns "37.3 g" into "37 3 g", so a size pattern anchored on a number
 * then eats only "3 g" and leaves a stray "37" behind. That put
 * "Nestle KitKat 4 Finger 37.3 g" and "Nestle Kit Kat 4 Finger" in different
 * variant groups - the same chocolate bar, twice, each entitled to its own
 * photograph. Sizes must be stripped before the decimal is destroyed.
 */
function normKeepingDecimals(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\.(?![0-9])/g, ' ')
    .trim()
}

/** The name with every stated pack size removed: the *product*, not the SKU. */
export function withoutSize(name: string): string {
  let out = normKeepingDecimals(name)
  for (const re of SIZE_PATTERNS) out = out.replace(re, ' ')
  // Any decimal that was not part of a size is not a size; flatten it now.
  return out.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
}

/** A stated pack size, normalised so "500 ml" and "500ml" compare equal.
 * Null when the text states none. */
export function quantityOf(s: string): string | null {
  const m = normKeepingDecimals(s).match(/(\d+(?:\s*\.\s*\d+)?)\s*(kg|g|gm|gms|ml|l|ltr|litre|liter)\b/)
  if (!m) return null
  const unit: Record<string, string> = { gm: 'g', gms: 'g', ltr: 'l', litre: 'l', liter: 'l' }
  return `${m[1].replace(/\s+/g, '')}${unit[m[2]] ?? m[2]}`
}

/**
 * True stopwords: packaging and filler that never identify anything, in any
 * aisle. Everything else that looks "generic" is generic only *relative to a
 * category*, and is computed from the catalogue — see `buildCategoryGenerics`.
 *
 * An earlier version of this file hardcoded a global list with `butter` and
 * `curd` on it. That left "Amul Butter 500 g" with no distinctive tokens at
 * all, which every gate then passed vacuously, and the matcher offered a tub
 * of Shrikhand. A word being common is not the same as a word being
 * uninformative.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'the', 'and', 'with', 'of', 'in', 'for', 'a', 'pack', 'packet', 'bottle',
  'box', 'tin', 'jar', 'pouch', 'refill', 'combo', 'set', 'new', 'regular',
])

/**
 * Words that describe the *form* a product takes. Two products that agree on
 * everything else but disagree here are different products — a cone is not a
 * tub — so an unexplained form word is a rejection, not a rounding error.
 */
export const FORM_WORDS: ReadonlySet<string> = new Set([
  'cone', 'cup', 'stick', 'sandwich', 'tub', 'brick', 'roll', 'slab',
  'sachet', 'liquid', 'gel', 'spray', 'wipes', 'strips', 'capsule',
  'tablet', 'syrup', 'granules', 'cubes', 'slice', 'slices', 'shredded',
  'diced', 'crushed', 'ground', 'sauce', 'chutney', 'pickle',
])

/** Brand, size and stopwords removed. What is left describes the product. */
export function contentTokens(name: string, brand: string | null): string[] {
  const brandWords = new Set(tokens(brand))
  return tokens(withoutSize(name)).filter(
    (w) => !brandWords.has(w) && !STOPWORDS.has(w) && !/^\d+$/.test(w) && w.length > 1,
  )
}

export interface CategorisedName {
  name: string
  brand: string | null
  categorySlug: string
}

/**
 * Words that carry no information *within their own category*, derived from
 * the catalogue rather than guessed: a token on more than `threshold` of a
 * category's items cannot distinguish one of them from another.
 *
 * `ice` and `cream` are on every tub in the freezer, so they are noise there.
 * `butter` is on part of the dairy shelf, so it is signal there. Only the
 * catalogue knows which is which, so only the catalogue decides.
 */
export function buildCategoryGenerics(
  items: readonly CategorisedName[],
  threshold = 0.6,
): Map<string, Set<string>> {
  const byCategory = new Map<string, { total: number; counts: Map<string, number> }>()
  for (const item of items) {
    let entry = byCategory.get(item.categorySlug)
    if (!entry) {
      entry = { total: 0, counts: new Map<string, number>() }
      byCategory.set(item.categorySlug, entry)
    }
    entry.total++
    for (const w of new Set(contentTokens(item.name, item.brand))) {
      entry.counts.set(w, (entry.counts.get(w) ?? 0) + 1)
    }
  }

  const out = new Map<string, Set<string>>()
  for (const [slug, { total, counts }] of byCategory) {
    const generic = new Set<string>()
    for (const [word, n] of counts) if (n / total > threshold) generic.add(word)
    out.set(slug, generic)
  }
  return out
}

/**
 * The tokens that identify this item among its neighbours.
 *
 * Never returns empty as a free pass: if stripping category-generic words
 * leaves nothing, the full content tokens are the distinctive set instead. An
 * empty requirement is a requirement that everything satisfies, which is how
 * Shrikhand became butter.
 */
export function distinctiveTokens(
  name: string,
  brand: string | null,
  categoryGenerics?: ReadonlySet<string>,
): string[] {
  const content = contentTokens(name, brand)
  if (!categoryGenerics) return content
  const distinctive = content.filter((w) => !categoryGenerics.has(w))
  return distinctive.length > 0 ? distinctive : content
}

export function slugify(s: string): string {
  return norm(s).replace(/ /g, '-')
}
