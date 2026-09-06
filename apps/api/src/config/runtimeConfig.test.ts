import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../db'
import { DEFAULT_RANKING_WEIGHTS, DEFAULT_DECAY_THRESHOLDS } from './constants'
import {
  getRankingWeights,
  setRankingWeights,
  getDecayThresholds,
  setDecayThresholds,
} from './runtimeConfig'

describe('runtimeConfig', () => {
  beforeEach(async () => {
    await prisma.appSetting.deleteMany({
      where: { key: { in: ['search.rankingWeights', 'availability.decayThresholds'] } },
    })
  })

  afterAll(async () => {
    await prisma.appSetting.deleteMany({
      where: { key: { in: ['search.rankingWeights', 'availability.decayThresholds'] } },
    })
    await prisma.$disconnect()
  })

  it('falls back to constants.ts defaults when nothing has been persisted', async () => {
    expect(await getRankingWeights()).toEqual(DEFAULT_RANKING_WEIGHTS)
    expect(await getDecayThresholds()).toEqual(DEFAULT_DECAY_THRESHOLDS)
  })

  it('persists an override for ranking weights and returns it on the next read', async () => {
    const override = { availabilityConfidence: 0.5, proximity: 0.2, shopRating: 0.2, isOpenNow: 0.1 }
    await setRankingWeights(override)
    expect(await getRankingWeights()).toEqual(override)
  })

  it('persists an override for decay thresholds and returns it on the next read', async () => {
    const override = { inStockFreshHours: 1, inStockStaleHours: 12, outOfStockTrustHours: 6 }
    await setDecayThresholds(override)
    expect(await getDecayThresholds()).toEqual(override)
  })

  it('an override survives a fresh read (persisted, not module state)', async () => {
    const override = { availabilityConfidence: 0.6, proximity: 0.1, shopRating: 0.2, isOpenNow: 0.1 }
    await setRankingWeights(override)
    const row = await prisma.appSetting.findUnique({ where: { key: 'search.rankingWeights' } })
    expect(row?.value).toEqual(override)
  })
})
