/**
 * `Shop.isOpenNow` is deliberately not a stored column (spec R3): a shop's
 * open/closed state changes every minute of the day, so persisting it would
 * mean either a cron job rewriting every row constantly, or a value that's
 * wrong most of the time. Instead we store the weekly schedule as JSON and
 * compute "open right now" at read time against `clock.now()`, so Phase 6's
 * time-travel demo changes `isOpenNow` for free — no extra job needed.
 */

export interface DayHours {
  open: string // "HH:mm", 24-hour
  close: string // "HH:mm", 24-hour
}

export interface OpeningHours {
  mon?: DayHours | null
  tue?: DayHours | null
  wed?: DayHours | null
  thu?: DayHours | null
  fri?: DayHours | null
  sat?: DayHours | null
  sun?: DayHours | null
  /** Merchant's manual "closed today" override — always wins. */
  isTemporarilyClosed?: boolean
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Computed, never stored (spec R3). `now` is always `clock.now()` in
 * production code — passed in explicitly here so this stays a pure,
 * trivially testable function.
 */
export function computeIsOpenNow(openingHours: OpeningHours | null | undefined, now: Date): boolean {
  if (!openingHours) return false
  if (openingHours.isTemporarilyClosed) return false

  const dayKey = DAY_KEYS[now.getDay()]
  const hours = openingHours[dayKey]
  if (!hours) return false // weekly off day

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = minutesSinceMidnight(hours.open)
  const closeMinutes = minutesSinceMidnight(hours.close)

  if (closeMinutes <= openMinutes) {
    // Overnight hours (e.g. 22:00-02:00) wrap past midnight.
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
}
