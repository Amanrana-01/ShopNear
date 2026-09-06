/**
 * Deciding whether a catalogue entry is a photograph of *this* product.
 *
 * Written after three false positives that a scoring-only matcher waved
 * through:
 *
 *   Havmor Chocolate Ice Cream 700 ml  ->  "Dark Chocolate Cone Ice Cream"
 *   Vadilal Kesar Pista Ice Cream 1 L  ->  "Kesar Motichoor Laddoo Mithai Ice Cream"
 *   Amul Butter 500 g                  ->  "Shrikhand"
 *
 * The first two scored well because `ice` and `cream` are shared by every tub
 * in the freezer. The third scored *perfectly* because a global "generic
 * words" list had `butter` on it, leaving the item with no requirements at all
 * — and a requirement of nothing is satisfied by everything.
 *
 * So matching here is **gates first, score second**. A candidate must survive
 * every hard gate to be eligible; the score only ranks survivors. Lowering the
 * threshold can never admit a wrong product, because the threshold is not what
 * rejects them. And the distinctive-token set is never allowed to be empty.
 */
import {
  distinctiveTokens, quantityOf, norm, tokens, FORM_WORDS, STOPWORDS,
} from './text'

export interface CatalogueItem {
  id: string
  slug: string
  name: string
  brand: string | null
  isBranded: boolean
  categorySlug: string
  variantGroupId: string
}

/** Where an item's image came from. Reported as three separate buckets and
 * never conflated: a generic commodity photograph is a correct image, not a
 * matched packshot, and folding them together hides what is really covered. */
export type ImageSource = 'packshot' | 'variant' | 'generic' | 'placeholder'

/** One Open Food Facts product, reduced to what matching needs. */
export interface OffCandidate {
  code: string
  productName: string
  /** The `brands` field, split on commas. Never the product name. */
  brands: string[]
  quantity: string | null
  countries: string[]
  /** Resolved front image, or null when the record has no usable one. */
  imageUrl: string | null
  imageLang: string | null
}

export type RejectReason =
  | 'no-front-image'
  | 'empty-name'
  | 'brand-absent'
  | 'foreign-brand'
  | 'missing-distinctive-token'
  | 'unexplained-form-word'
  | 'unexplained-tokens'
  | 'below-threshold'

export interface MatchVerdict {
  candidate: OffCandidate
  accepted: boolean
  confidence: number
  reason: RejectReason | null
  /** Human-readable trace, printed by the sampler and kept on rejections. */
  detail: string
}

/** Accept nothing below this. Raising it is safe; lowering it does not admit
 * wrong products, only weaker evidence for right ones. */
export const CONFIDENCE_THRESHOLD = 0.75

/**
 * Every brand in our own catalogue, lowercased. Used by the foreign-brand
 * gate: if a record is branded for someone else we also stock, it is that
 * other brand's product, whatever else the record says.
 */
export function buildBrandUniverse(items: readonly CatalogueItem[]): Set<string> {
  const out = new Set<string>()
  for (const i of items) if (i.brand) out.add(norm(i.brand))
  return out
}

function brandMatches(itemBrand: string, candidateBrands: readonly string[]): boolean {
  const want = norm(itemBrand)
  return candidateBrands.some((b) => {
    const got = norm(b)
    // Exact, or one contains the other as a whole phrase: "Amul" matches
    // "Amul Taaza" but never "Amulya Foods".
    return got === want || got.startsWith(`${want} `) || got.endsWith(` ${want}`)
  })
}

export function scoreCandidate(
  item: CatalogueItem,
  candidate: OffCandidate,
  brandUniverse: ReadonlySet<string>,
  categoryGenerics?: ReadonlySet<string>,
): MatchVerdict {
  const reject = (reason: RejectReason, detail: string): MatchVerdict => ({
    candidate, accepted: false, confidence: 0, reason, detail,
  })

  // Gate 1 — there has to be a photograph, and a name to check it against.
  // A record with a blank product_name satisfies every token test vacuously.
  if (!candidate.imageUrl) return reject('no-front-image', 'record has no front image')
  if (candidate.productName.trim().length === 0) {
    return reject('empty-name', 'record has no product name to verify against')
  }

  // Gate 2 — the brand must be on the record's `brands` field. Deliberately
  // not the product name: an Itambe carton whose description mentions Amul is
  // still an Itambe carton.
  if (item.brand) {
    if (candidate.brands.length === 0) {
      return reject('brand-absent', 'record states no brand')
    }
    if (!brandMatches(item.brand, candidate.brands)) {
      return reject('brand-absent', `brands=[${candidate.brands.join(', ')}] lacks "${item.brand}"`)
    }
    // Gate 3 — and no *other* brand we stock may also be on it.
    const mine = norm(item.brand)
    const foreign = candidate.brands
      .map(norm)
      .filter((b) => b.length > 0 && b !== mine && brandUniverse.has(b))
    if (foreign.length > 0) return reject('foreign-brand', `also branded ${foreign.join(', ')}`)
  }

  // Gate 4 — every distinctive word of ours must be on the pack. "Kesar
  // Pista" needs both kesar and pista; this rejects the Motichoor Laddoo tub.
  const want = distinctiveTokens(item.name, item.brand, categoryGenerics)
  const haveTokens = tokens(candidate.productName)
  const have = new Set(haveTokens)
  const missing = want.filter((w) => !have.has(w))
  if (missing.length > 0) {
    return reject('missing-distinctive-token', `pack does not say: ${missing.join(', ')}`)
  }

  // Gate 5 — no unexplained form word. A cone is not a tub.
  const wantSet = new Set<string>([
    ...want,
    ...tokens(item.brand ?? ''),
    ...(categoryGenerics ?? []),
  ])
  const unexplained = haveTokens.filter(
    (w) => !wantSet.has(w) && !STOPWORDS.has(w) && !/^[0-9]+$/.test(w) && w.length > 1,
  )
  const formWord = unexplained.find((w) => FORM_WORDS.has(w))
  if (formWord) return reject('unexplained-form-word', `pack says "${formWord}", ours does not`)

  // Gate 6 — and not many unexplained words of any kind.
  if (unexplained.length > 1) {
    return reject('unexplained-tokens', `pack adds: ${unexplained.join(', ')}`)
  }

  // Size is a *preference*, not a gate. Genuine size variants of one product
  // share a variantGroupId and are explicitly allowed to share a photograph,
  // so an Amul Butter 100 g packshot is a correct image for the Amul Butter
  // group. Matching the stated size exactly just ranks higher.
  const wantQty = quantityOf(item.name)
  const haveQty = quantityOf(`${candidate.productName} ${candidate.quantity ?? ''}`)

  const overlap = want.filter((w) => have.has(w)).length / want.length
  const precision = unexplained.length === 0 ? 1 : 0.7

  let confidence = 0.5 * overlap + 0.15 * precision
  if (wantQty && haveQty && wantQty === haveQty) confidence += 0.25
  else if (!haveQty) confidence += 0.08
  if (candidate.countries.some((c) => /india/i.test(c))) confidence += 0.12
  if (candidate.imageLang === 'en' || candidate.imageLang === 'in') confidence += 0.05
  confidence = Math.min(1, Number(confidence.toFixed(3)))

  if (confidence < CONFIDENCE_THRESHOLD) {
    return reject('below-threshold', `confidence ${confidence} < ${CONFIDENCE_THRESHOLD}`)
  }
  return {
    candidate,
    accepted: true,
    confidence,
    reason: null,
    detail: `needs [${want.join(' ')}], size ${wantQty ?? '-'}/${haveQty ?? '-'}, ${unexplained.length} unexplained`,
  }
}

/** Best accepted candidate for an item, plus every verdict for the report. */
export function bestMatch(
  item: CatalogueItem,
  candidates: readonly OffCandidate[],
  brandUniverse: ReadonlySet<string>,
  categoryGenerics?: ReadonlySet<string>,
): { accepted: MatchVerdict | null; considered: MatchVerdict[] } {
  const considered = candidates.map((c) =>
    scoreCandidate(item, c, brandUniverse, categoryGenerics))
  const accepted = considered
    .filter((v) => v.accepted)
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null
  return { accepted, considered }
}
