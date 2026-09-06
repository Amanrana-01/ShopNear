/**
 * Client-side fuzzy name matcher for the duplicate-catalogue detector
 * (spec §10: "Amul Butter 500g" vs "amul butter 500 gm"). Deliberately a
 * small, dependency-free re-implementation of the same idea the API uses
 * server-side for typo-tolerant search (`pg_trgm` trigram similarity, see
 * apps/api/src/modules/search/search.service.ts) — a normalised Dice
 * coefficient over character bigrams — so the two systems agree on what
 * "close" means, without this app importing anything from apps/api.
 */

/** Lowercase, collapse whitespace, and normalise unit shorthand so "500g"
 * and "500 gm" compare the same way a person would read them. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/(\d+)\s*g\b/g, '$1 gm')
    .replace(/(\d+)\s*gm\b/g, '$1 gm')
    .replace(/(\d+)\s*kg\b/g, '$1 kg')
    .replace(/(\d+)\s*ml\b/g, '$1 ml')
    .replace(/(\d+)\s*l\b/g, '$1 ltr')
    .replace(/(\d+)\s*ltr\b/g, '$1 ltr')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>()
  const padded = ` ${s} `
  for (let i = 0; i < padded.length - 1; i++) {
    const bg = padded.slice(i, i + 2)
    map.set(bg, (map.get(bg) ?? 0) + 1)
  }
  return map
}

/** Sørensen–Dice coefficient over character bigrams, 0..1. */
export function similarity(a: string, b: string): number {
  const na = normaliseName(a)
  const nb = normaliseName(b)
  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0

  const bgA = bigrams(na)
  const bgB = bigrams(nb)
  let intersection = 0
  for (const [bg, countA] of bgA) {
    const countB = bgB.get(bg)
    if (countB) intersection += Math.min(countA, countB)
  }
  const totalA = [...bgA.values()].reduce((s, n) => s + n, 0)
  const totalB = [...bgB.values()].reduce((s, n) => s + n, 0)
  return (2 * intersection) / (totalA + totalB)
}

export interface DuplicateCandidate {
  a: { id: string; name: string }
  b: { id: string; name: string }
  score: number
}

/** All pairs scoring at or above `threshold`, sorted highest-first. O(n^2) —
 * fine for the few hundred distinct products this tool ever sees at once. */
export function findDuplicateCandidates(
  products: Array<{ id: string; name: string }>,
  threshold = 0.72,
): DuplicateCandidate[] {
  const out: DuplicateCandidate[] = []
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      if (products[i].id === products[j].id) continue
      const score = similarity(products[i].name, products[j].name)
      if (score >= threshold) out.push({ a: products[i], b: products[j], score })
    }
  }
  return out.sort((x, y) => y.score - x.score)
}
