import { prisma } from '../../db'
import { findCandidates } from './search.service'
import type { MultiSearchBodyInput } from './search.schemas'

interface ShopCoverage {
  shop: { id: string; name: string; distanceMeters: number }
  covered: Set<string>
}

export interface ShopCoverageResult {
  shop: { id: string; name: string; distanceMeters: number } | null
  covered: string[]
  missing: string[]
}

export interface MultiSearchResult {
  bestShop: ShopCoverageResult
  split: Array<{ shop: { id: string; name: string; distanceMeters: number }; covered: string[] }>
}

/**
 * The headline differentiator versus quick-commerce apps (spec §8): given a
 * shopping list ("atta, doodh, Maggi, sabun"), find the single nearby shop
 * that covers the most of it, plus a greedy two-shop split for whatever it
 * can't. Reuses `findCandidates` per item — the same keyword-containment +
 * pg_trgm matching that powers single-item search — so "does this shop
 * carry X" means the same thing here as it does in `GET /api/search`.
 */
export async function multiItemSearch(input: MultiSearchBodyInput, userId?: string): Promise<MultiSearchResult> {
  const { items, lat, lng, radius } = input

  const perItem = await Promise.all(
    items.map(async (item) => ({ item, candidates: await findCandidates(item, lat, lng, radius) })),
  )

  // Every item nobody in radius stocks is itself a zero-result search —
  // logged individually so the unmet-demand report can name the exact item,
  // not just the whole multi-item query (spec §8).
  await Promise.all(
    perItem
      .filter(({ candidates }) => candidates.length === 0)
      .map(({ item }) => prisma.searchLog.create({ data: { userId: userId ?? null, queryText: item, resultCount: 0, lat, lng } })),
  )

  const shopCoverage = new Map<string, ShopCoverage>()
  for (const { item, candidates } of perItem) {
    const seenShops = new Set<string>()
    for (const candidate of candidates) {
      if (seenShops.has(candidate.shopId)) continue // count each item at most once per shop
      seenShops.add(candidate.shopId)

      let entry = shopCoverage.get(candidate.shopId)
      if (!entry) {
        entry = {
          shop: { id: candidate.shopId, name: candidate.shopName, distanceMeters: Math.round(Number(candidate.distanceMeters)) },
          covered: new Set(),
        }
        shopCoverage.set(candidate.shopId, entry)
      }
      entry.covered.add(item)
    }
  }

  const shopsByCoverage = [...shopCoverage.values()].sort(
    (a, b) => b.covered.size - a.covered.size || a.shop.distanceMeters - b.shop.distanceMeters,
  )

  const best = shopsByCoverage[0]
  const bestShop: ShopCoverageResult = best
    ? { shop: best.shop, covered: [...best.covered], missing: items.filter((i) => !best.covered.has(i)) }
    : { shop: null, covered: [], missing: [...items] }

  const split: MultiSearchResult['split'] = []
  if (best) {
    split.push({ shop: best.shop, covered: [...best.covered] })

    const remaining = items.filter((i) => !best.covered.has(i))
    if (remaining.length > 0) {
      // Greedy: among every other shop, pick the one covering the most of
      // what's still missing (ties broken by distance).
      let secondBest: ShopCoverage | null = null
      let secondCovered: string[] = []
      for (const entry of shopsByCoverage.slice(1)) {
        const coveredRemaining = remaining.filter((i) => entry.covered.has(i))
        if (
          coveredRemaining.length > secondCovered.length ||
          (coveredRemaining.length === secondCovered.length &&
            secondBest &&
            entry.shop.distanceMeters < secondBest.shop.distanceMeters)
        ) {
          secondBest = entry
          secondCovered = coveredRemaining
        }
      }
      if (secondBest && secondCovered.length > 0) {
        split.push({ shop: secondBest.shop, covered: secondCovered })
      }
    }
  }

  return { bestShop, split }
}
