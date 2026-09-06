import { prisma } from '../db'
import { DEFAULT_RANKING_WEIGHTS, DEFAULT_DECAY_THRESHOLDS } from './constants'

/**
 * Runtime-adjustable knobs (spec R5). Ranking weights and decay thresholds
 * ship with defaults in `constants.ts`, but are persisted as `AppSetting`
 * rows so the admin panel's sliders have somewhere durable to write, and so
 * changes apply immediately without a restart.
 */
const RANKING_WEIGHTS_KEY = 'search.rankingWeights'
const DECAY_THRESHOLDS_KEY = 'availability.decayThresholds'

export interface RankingWeights {
  availabilityConfidence: number
  proximity: number
  shopRating: number
  isOpenNow: number
}

export interface DecayThresholds {
  inStockFreshHours: number
  inStockStaleHours: number
  outOfStockTrustHours: number
}

export async function getRankingWeights(): Promise<RankingWeights> {
  const row = await prisma.appSetting.findUnique({ where: { key: RANKING_WEIGHTS_KEY } })
  return (row?.value as RankingWeights | undefined) ?? DEFAULT_RANKING_WEIGHTS
}

export async function setRankingWeights(weights: RankingWeights): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: RANKING_WEIGHTS_KEY },
    create: { key: RANKING_WEIGHTS_KEY, value: weights },
    update: { value: weights },
  })
}

export async function getDecayThresholds(): Promise<DecayThresholds> {
  const row = await prisma.appSetting.findUnique({ where: { key: DECAY_THRESHOLDS_KEY } })
  return (row?.value as DecayThresholds | undefined) ?? DEFAULT_DECAY_THRESHOLDS
}

export async function setDecayThresholds(thresholds: DecayThresholds): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: DECAY_THRESHOLDS_KEY },
    create: { key: DECAY_THRESHOLDS_KEY, value: thresholds },
    update: { value: thresholds },
  })
}
