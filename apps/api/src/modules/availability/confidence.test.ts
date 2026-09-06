import { describe, it, expect } from 'vitest'
import { computeBadge, confidenceScore } from './confidence'
import { DEFAULT_DECAY_THRESHOLDS } from '../../config/constants'

// Fixed "now" so every test reasons about the same clock (per spec §7's
// "measured against clock.now()" — this stands in for clock.now() here).
const NOW = new Date('2026-09-05T12:00:00.000Z')
const hoursBefore = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000)
const minutesBefore = (m: number) => new Date(NOW.getTime() - m * 60 * 1000)

describe('computeBadge — spec §7 table, one test per row', () => {
  it('IN_STOCK updated < 2h ago -> In stock (green), with a "confirmed N min ago" detail', () => {
    const badge = computeBadge('IN_STOCK', minutesBefore(20), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('In stock')
    expect(badge.tone).toBe('green')
    expect(badge.detail).toBe('confirmed 20 min ago')
  })

  it('IN_STOCK updated 2-24h ago -> Likely available (green-amber)', () => {
    const badge = computeBadge('IN_STOCK', hoursBefore(10), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Likely available')
    expect(badge.tone).toBe('green-amber')
  })

  it('IN_STOCK updated > 24h ago -> Usually available (amber)', () => {
    const badge = computeBadge('IN_STOCK', hoursBefore(48), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Usually available')
    expect(badge.tone).toBe('amber')
  })

  it('USUALLY_AVAILABLE -> Usually available (amber), with the "normally stocks" detail', () => {
    const badge = computeBadge('USUALLY_AVAILABLE', hoursBefore(100), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Usually available')
    expect(badge.tone).toBe('amber')
    expect(badge.detail).toBe('this shop normally stocks this')
  })

  it('OUT_OF_STOCK updated < 12h ago -> Out of stock (red)', () => {
    const badge = computeBadge('OUT_OF_STOCK', hoursBefore(3), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Out of stock')
    expect(badge.tone).toBe('red')
  })

  it('OUT_OF_STOCK updated > 12h ago -> Usually available (amber) — assume restocked (non-obvious row)', () => {
    const badge = computeBadge('OUT_OF_STOCK', hoursBefore(20), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Usually available')
    expect(badge.tone).toBe('amber')
  })

  it('UNKNOWN -> Ask the shop (grey), reserving still allowed', () => {
    const badge = computeBadge('UNKNOWN', hoursBefore(1), NOW, DEFAULT_DECAY_THRESHOLDS)
    expect(badge.label).toBe('Ask the shop')
    expect(badge.tone).toBe('grey')
  })

  it('no record at all (undefined availability / updatedAt) -> Ask the shop (non-obvious row)', () => {
    expect(computeBadge(undefined, undefined, NOW, DEFAULT_DECAY_THRESHOLDS)).toEqual({
      label: 'Ask the shop',
      tone: 'grey',
    })
    expect(computeBadge(null, null, NOW, DEFAULT_DECAY_THRESHOLDS)).toEqual({
      label: 'Ask the shop',
      tone: 'grey',
    })
  })

  it('thresholds come from runtimeConfig, not hard-coded literals — a custom threshold changes the outcome', () => {
    const looseThresholds = { inStockFreshHours: 5, inStockStaleHours: 50, outOfStockTrustHours: 1 }
    // 3h old IN_STOCK would normally be "Likely available" (default fresh=2h),
    // but with a 5h fresh threshold it's still "In stock".
    const badge = computeBadge('IN_STOCK', hoursBefore(3), NOW, looseThresholds)
    expect(badge.label).toBe('In stock')
  })
})

describe('confidenceScore', () => {
  it('ranks tones green > green-amber > amber > grey > red', () => {
    const scoreOf = (tone: 'green' | 'green-amber' | 'amber' | 'red' | 'grey') =>
      confidenceScore({ label: 'Ask the shop', tone } as never)
    expect(scoreOf('green')).toBeGreaterThan(scoreOf('green-amber'))
    expect(scoreOf('green-amber')).toBeGreaterThan(scoreOf('amber'))
    expect(scoreOf('amber')).toBeGreaterThan(scoreOf('grey'))
    expect(scoreOf('grey')).toBeGreaterThan(scoreOf('red'))
  })
})
