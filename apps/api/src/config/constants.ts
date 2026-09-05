/**
 * Defaults for everything the admin panel can override live during a demo
 * (spec R5). Kept in one file so a presenter can point at it, and so
 * `runtimeConfig.ts` has somewhere to fall back to when no override has been
 * saved yet.
 */
export const DEFAULT_RANKING_WEIGHTS = {
  availabilityConfidence: 0.4,
  proximity: 0.3,
  shopRating: 0.2,
  isOpenNow: 0.1,
} as const

/** Hours. Drives both the badge table (spec §7) and the decay job. */
export const DEFAULT_DECAY_THRESHOLDS = {
  inStockFreshHours: 2, // "In stock" -> "Likely available"
  inStockStaleHours: 24, // "Likely available" -> "Usually available"
  outOfStockTrustHours: 12, // "Out of stock" -> assume restocked
} as const

export const RESERVATION_EXPIRY_HOURS = 2
export const DEFAULT_SEARCH_RADIUS_M = 1000
export const ALLOWED_SEARCH_RADII_M = [250, 500, 1000, 3000] as const

/** OTP is always this value for the demo — never randomly generated, never stored (spec §5). */
export const DEMO_OTP = '123456'

export const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_TTL_DAYS = 30
