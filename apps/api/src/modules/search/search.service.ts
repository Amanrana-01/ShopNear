import { prisma } from '../../db'
import * as clock from '../../clock/clock'
import { getRankingWeights, getDecayThresholds } from '../../config/runtimeConfig'
import { computeBadge, confidenceScore, type Badge } from '../availability/confidence'
import { computeIsOpenNow, type OpeningHours } from '../shops/openingHours'
import { scoreResult } from './ranking'
import type { SearchQueryInput } from './search.schemas'

export interface SearchCandidateRow {
  shopId: string
  shopName: string
  shopLat: number
  shopLng: number
  shopRating: number
  shopRatingCount: number
  openingHours: unknown
  distanceMeters: number
  productId: string
  productName: string
  productNameGu: string
  imageUrl: string | null
  unitType: string
  defaultUnitLabel: string
  price: number
  availability: import('@prisma/client').Availability
  availabilityUpdatedAt: Date
}

/**
 * The matching core shared by single-item search (this file) and
 * multi-item search (`multiSearch.service.ts`): for one search term, every
 * `(shop, product)` pair within `radiusM` of `(lat, lng)` that the term
 * could plausibly mean.
 *
 * Two independent signals combine here (spec §8):
 *  - `Product.searchKeywords` **array containment** — an exact element
 *    match, which is how "atta"/"aata"/"ata" all resolve to the same
 *    wheat-flour products: each literal spelling is seeded as its own
 *    keyword.
 *  - `pg_trgm` **similarity** on `Product.name` (and, as a second pass, on
 *    each keyword) — typo tolerance for spellings nobody thought to seed
 *    explicitly.
 *
 * Radius filtering is PostGIS `ST_DWithin` against the GIST-indexed
 * `Shop.location` geography column, never Haversine in JS (spec §13).
 * `PENDING`/`SUSPENDED` shops are excluded here, not just at read time —
 * they must never enter a customer-facing result set at all.
 */
export async function findCandidates(term: string, lat: number, lng: number, radiusM: number): Promise<SearchCandidateRow[]> {
  const normalised = term.trim().toLowerCase()

  return prisma.$queryRaw<SearchCandidateRow[]>`
    SELECT s.id AS "shopId", s.name AS "shopName", s.lat AS "shopLat", s.lng AS "shopLng",
           s."avgRating" AS "shopRating", s."ratingCount" AS "shopRatingCount", s."openingHours",
           ST_Distance(s.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS "distanceMeters",
           p.id AS "productId", p.name AS "productName", p."nameGu" AS "productNameGu",
           p."imageUrl", p."unitType", p."defaultUnitLabel",
           si.price, si.availability, si."availabilityUpdatedAt"
    FROM "ShopInventory" si
    JOIN "Product" p ON p.id = si."productId"
    JOIN "Shop" s ON s.id = si."shopId"
    WHERE s.status = 'ACTIVE'
      AND si."isActive" = true
      AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusM})
      AND (
        ${normalised} = ANY(p."searchKeywords")
        OR similarity(p.name, ${term}) > 0.2
        OR EXISTS (SELECT 1 FROM unnest(p."searchKeywords") kw WHERE similarity(kw, ${normalised}) > 0.35)
      )
    ORDER BY "distanceMeters" ASC
  `
}

export interface RankedResult {
  shopId: string
  shopName: string
  distanceMeters: number
  isOpenNow: boolean
  product: {
    id: string
    name: string
    nameGu: string
    imageUrl: string | null
    unitType: string
    defaultUnitLabel: string
  }
  price: number
  badge: Badge
  score: number
}

/**
 * `q` -> ranked, paginated results, plus a `SearchLog` row on every call —
 * including a zero-result search (spec §8: this is what powers the
 * unmet-demand report). `userId` is optional: search works for anonymous
 * browsing too.
 */
export async function searchProducts(input: SearchQueryInput, userId?: string) {
  const now = clock.now()
  const [weights, thresholds, candidates] = await Promise.all([
    getRankingWeights(),
    getDecayThresholds(),
    findCandidates(input.q, input.lat, input.lng, input.radius),
  ])

  const ranked: RankedResult[] = candidates.map((row) => {
    const distanceMeters = Math.round(Number(row.distanceMeters))
    const isOpenNow = computeIsOpenNow(row.openingHours as OpeningHours, now)
    const badge = computeBadge(row.availability, row.availabilityUpdatedAt, now, thresholds)
    const score = scoreResult(
      { confidence: confidenceScore(badge), distanceM: distanceMeters, radiusM: input.radius, rating: row.shopRating, isOpenNow },
      weights,
    )
    return {
      shopId: row.shopId,
      shopName: row.shopName,
      distanceMeters,
      isOpenNow,
      product: {
        id: row.productId,
        name: row.productName,
        nameGu: row.productNameGu,
        imageUrl: row.imageUrl,
        unitType: row.unitType,
        defaultUnitLabel: row.defaultUnitLabel,
      },
      // Never emit a stock count anywhere (spec R-constraint) — price and
      // the badge are the only availability-adjacent fields a result carries.
      price: row.price,
      badge,
      score,
    }
  })

  ranked.sort((a, b) => b.score - a.score)

  const total = ranked.length
  const start = (input.page - 1) * input.pageSize
  const page = ranked.slice(start, start + input.pageSize)

  // Written unconditionally, including resultCount: 0 — every search, hit
  // or miss, is signal for the unmet-demand report.
  await prisma.searchLog.create({
    data: { userId: userId ?? null, queryText: input.q, resultCount: total, lat: input.lat, lng: input.lng },
  })

  return { results: page, total, page: input.page, pageSize: input.pageSize }
}
