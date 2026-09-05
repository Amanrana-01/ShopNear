import { describe, it, expect } from 'vitest'
import { scoreResult } from './ranking'
import { DEFAULT_RANKING_WEIGHTS } from '../../config/constants'

describe('scoreResult', () => {
  it('scores a closer, higher-confidence, open, well-rated shop above a far, low-confidence, closed one', () => {
    const good = scoreResult(
      { confidence: 1, distanceM: 50, radiusM: 1000, rating: 4.5, isOpenNow: true },
      DEFAULT_RANKING_WEIGHTS,
    )
    const bad = scoreResult(
      { confidence: 0.15, distanceM: 950, radiusM: 1000, rating: 2, isOpenNow: false },
      DEFAULT_RANKING_WEIGHTS,
    )
    expect(good).toBeGreaterThan(bad)
  })

  it('changing the ranking weights changes which of two results scores higher', () => {
    const nearButLowConfidence = { confidence: 0.15, distanceM: 20, radiusM: 1000, rating: 3, isOpenNow: true }
    const farButHighConfidence = { confidence: 1, distanceM: 900, radiusM: 1000, rating: 3, isOpenNow: true }

    const proximityHeavy = { availabilityConfidence: 0.05, proximity: 0.85, shopRating: 0.05, isOpenNow: 0.05 }
    const confidenceHeavy = { availabilityConfidence: 0.85, proximity: 0.05, shopRating: 0.05, isOpenNow: 0.05 }

    const underProximityHeavy = [
      scoreResult(nearButLowConfidence, proximityHeavy),
      scoreResult(farButHighConfidence, proximityHeavy),
    ]
    const underConfidenceHeavy = [
      scoreResult(nearButLowConfidence, confidenceHeavy),
      scoreResult(farButHighConfidence, confidenceHeavy),
    ]

    // Under proximity-heavy weights the near shop wins; flip the weights
    // toward confidence and the far shop wins instead — order reverses.
    expect(underProximityHeavy[0]).toBeGreaterThan(underProximityHeavy[1])
    expect(underConfidenceHeavy[1]).toBeGreaterThan(underConfidenceHeavy[0])
  })

  it('is monotonically higher for a closer shop, all else equal', () => {
    const near = scoreResult({ confidence: 0.5, distanceM: 100, radiusM: 1000, rating: 3, isOpenNow: true }, DEFAULT_RANKING_WEIGHTS)
    const far = scoreResult({ confidence: 0.5, distanceM: 800, radiusM: 1000, rating: 3, isOpenNow: true }, DEFAULT_RANKING_WEIGHTS)
    expect(near).toBeGreaterThan(far)
  })
})
