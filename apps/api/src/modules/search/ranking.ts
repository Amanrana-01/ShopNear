import type { RankingWeights } from '../../config/runtimeConfig'

/**
 * Search ranking is a weighted composite, not distance alone (spec §8):
 * `w1·availabilityConfidence + w2·proximity + w3·shopRating + w4·isOpenNow`.
 * `weights` always comes from `runtimeConfig.getRankingWeights()`, never a
 * hard-coded literal — moving a slider in the admin panel changes result
 * order live, which is exactly the demo moment the spec calls out.
 */
export interface ScoreInput {
  /** 0-1, from `confidenceScore()` in the availability module. */
  confidence: number
  distanceM: number
  /** The search radius the distance is being judged against. */
  radiusM: number
  /** Shop.avgRating, 0-5. */
  rating: number
  isOpenNow: boolean
}

export function scoreResult(input: ScoreInput, weights: RankingWeights): number {
  // Linearly falls from 1 (right at the anchor) to 0 (at the edge of the
  // search radius) — cheap, monotonic, and good enough for ranking within
  // a single bounded radius query.
  const proximityScore = 1 - Math.min(input.distanceM / Math.max(input.radiusM, 1), 1)
  const ratingScore = Math.min(Math.max(input.rating, 0), 5) / 5
  const openScore = input.isOpenNow ? 1 : 0

  return (
    weights.availabilityConfidence * input.confidence +
    weights.proximity * proximityScore +
    weights.shopRating * ratingScore +
    weights.isOpenNow * openScore
  )
}
