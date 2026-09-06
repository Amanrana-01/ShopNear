import type { Availability, Badge, BadgeTone, RankingWeights, DecayThresholds } from '@/types'

/**
 * Client-side mirror of the API's ranking/confidence math, used ONLY to
 * power the admin panel's live "what would change" preview — never to
 * compute anything a customer sees (that always comes from the server).
 * Copied from, and must stay in lockstep with:
 *   - apps/api/src/config/constants.ts        (defaults)
 *   - apps/api/src/modules/search/ranking.ts   (scoreResult)
 *   - apps/api/src/modules/availability/confidence.ts (computeBadge, confidenceScore)
 * Read-only reference — apps/api/ itself is untouched by this workspace.
 */

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  availabilityConfidence: 0.4,
  proximity: 0.3,
  shopRating: 0.2,
  isOpenNow: 0.1,
}

export const DEFAULT_DECAY_THRESHOLDS: DecayThresholds = {
  inStockFreshHours: 2,
  inStockStaleHours: 24,
  outOfStockTrustHours: 12,
}

export interface ScoreInput {
  confidence: number
  distanceM: number
  radiusM: number
  rating: number
  isOpenNow: boolean
}

export function scoreResult(input: ScoreInput, weights: RankingWeights): number {
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

export function scoreBreakdown(input: ScoreInput, weights: RankingWeights) {
  const proximityScore = 1 - Math.min(input.distanceM / Math.max(input.radiusM, 1), 1)
  const ratingScore = Math.min(Math.max(input.rating, 0), 5) / 5
  const openScore = input.isOpenNow ? 1 : 0
  return {
    availabilityConfidence: weights.availabilityConfidence * input.confidence,
    proximity: weights.proximity * proximityScore,
    shopRating: weights.shopRating * ratingScore,
    isOpenNow: weights.isOpenNow * openScore,
  }
}

const TONE_SCORE: Record<BadgeTone, number> = {
  green: 1,
  'green-amber': 0.75,
  amber: 0.5,
  red: 0.15,
  grey: 0.3,
}
export function confidenceScoreFromTone(tone: BadgeTone): number {
  return TONE_SCORE[tone]
}

/** Mirrors confidence.ts's computeBadge, but takes a plain "age in hours"
 * instead of (updatedAt, now) — the admin preview drives age from a slider. */
export function computeBadgePreview(availability: Availability, ageHours: number, thresholds: DecayThresholds): Badge {
  if (!availability || availability === 'UNKNOWN') return { label: 'Ask the shop', tone: 'grey' }

  if (availability === 'IN_STOCK') {
    if (ageHours < thresholds.inStockFreshHours) return { label: 'In stock', tone: 'green', detail: `confirmed ~${Math.round(ageHours * 60)} min ago` }
    if (ageHours < thresholds.inStockStaleHours) return { label: 'Likely available', tone: 'green-amber' }
    return { label: 'Usually available', tone: 'amber' }
  }
  if (availability === 'USUALLY_AVAILABLE') return { label: 'Usually available', tone: 'amber', detail: 'this shop normally stocks this' }

  // OUT_OF_STOCK
  if (ageHours < thresholds.outOfStockTrustHours) return { label: 'Out of stock', tone: 'red' }
  return { label: 'Usually available', tone: 'amber' }
}
