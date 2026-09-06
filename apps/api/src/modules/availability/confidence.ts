import type { Availability } from '@prisma/client'
import type { DecayThresholds } from '../../config/runtimeConfig'

/**
 * The availability confidence model (spec §7) — the intellectual core of
 * the whole project. ShopNear never promises a live stock count because a
 * small shop cannot maintain one; instead every product/shop pair carries
 * an enum plus a timestamp, and the *badge* shown to the customer is
 * derived from how stale that timestamp is. Never emit a stock count from
 * anywhere that calls this.
 *
 * Two rows in the table below are deliberately non-obvious and easy to get
 * backwards:
 *  - A stale `OUT_OF_STOCK` (> outOfStockTrustHours) becomes "Usually
 *    available" again, not "still out of stock" — we assume the shop
 *    restocked rather than continuing to distrust an old negative signal.
 *  - `UNKNOWN` / no record still shows "Ask the shop", and reserving is
 *    still allowed — absence of data is not a reason to hide the shop.
 *
 * `thresholds` always comes from `runtimeConfig.getDecayThresholds()`,
 * never a hard-coded literal, so the admin panel's sliders can move these
 * live during a demo.
 */
export type BadgeTone = 'green' | 'green-amber' | 'amber' | 'red' | 'grey'

export interface Badge {
  label: 'In stock' | 'Likely available' | 'Usually available' | 'Out of stock' | 'Ask the shop'
  tone: BadgeTone
  detail?: string
}

function minutesAgo(updatedAt: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - updatedAt.getTime()) / 60_000))
}

function hoursAgo(updatedAt: Date, now: Date): number {
  return (now.getTime() - updatedAt.getTime()) / (60 * 60 * 1000)
}

const ASK_THE_SHOP: Badge = { label: 'Ask the shop', tone: 'grey' }

export function computeBadge(
  availability: Availability | null | undefined,
  updatedAt: Date | null | undefined,
  now: Date,
  thresholds: DecayThresholds,
): Badge {
  if (!availability || availability === 'UNKNOWN' || !updatedAt) {
    return ASK_THE_SHOP
  }

  const age = hoursAgo(updatedAt, now)

  if (availability === 'IN_STOCK') {
    if (age < thresholds.inStockFreshHours) {
      return { label: 'In stock', tone: 'green', detail: `confirmed ${minutesAgo(updatedAt, now)} min ago` }
    }
    if (age < thresholds.inStockStaleHours) {
      return { label: 'Likely available', tone: 'green-amber' }
    }
    return { label: 'Usually available', tone: 'amber' }
  }

  if (availability === 'USUALLY_AVAILABLE') {
    return { label: 'Usually available', tone: 'amber', detail: 'this shop normally stocks this' }
  }

  // OUT_OF_STOCK
  if (age < thresholds.outOfStockTrustHours) {
    return { label: 'Out of stock', tone: 'red' }
  }
  // Stale negative signal — assume restocked rather than continuing to
  // show "out of stock" indefinitely (spec §7's non-obvious row).
  return { label: 'Usually available', tone: 'amber' }
}

/**
 * Maps a badge to a 0-1 numeric confidence score for ranking purposes only
 * (spec §8's composite score). This number is never sent to a client —
 * only the badge (label + tone + detail) is ever exposed in a response.
 */
const TONE_SCORE: Record<BadgeTone, number> = {
  green: 1,
  'green-amber': 0.75,
  amber: 0.5,
  red: 0.15,
  grey: 0.3,
}

export function confidenceScore(badge: Badge): number {
  return TONE_SCORE[badge.tone]
}
