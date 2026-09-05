import { describe, it, expect } from 'vitest'
import { computeIsOpenNow, type OpeningHours } from './openingHours'

const STANDARD: OpeningHours = {
  mon: { open: '09:00', close: '21:00' },
  tue: { open: '09:00', close: '21:00' },
  wed: { open: '09:00', close: '21:00' },
  thu: { open: '09:00', close: '21:00' },
  fri: { open: '09:00', close: '21:00' },
  sat: { open: '09:00', close: '21:00' },
  sun: { open: '10:00', close: '14:00' },
  isTemporarilyClosed: false,
}

// A Tuesday (day index 2) at 15:00 local time — comfortably inside the
// 09:00-21:00 Mon-Sat window.
function tuesdayAt(hh: number, mm: number): Date {
  const d = new Date(2026, 8, 8) // Tue Sep 8 2026 (month is 0-indexed)
  d.setHours(hh, mm, 0, 0)
  return d
}

describe('computeIsOpenNow', () => {
  it('is true inside the day\'s open/close window', () => {
    expect(computeIsOpenNow(STANDARD, tuesdayAt(15, 0))).toBe(true)
  })

  it('is false before opening time', () => {
    expect(computeIsOpenNow(STANDARD, tuesdayAt(7, 0))).toBe(false)
  })

  it('is false after closing time', () => {
    expect(computeIsOpenNow(STANDARD, tuesdayAt(22, 0))).toBe(false)
  })

  it('is false at the exact closing minute', () => {
    expect(computeIsOpenNow(STANDARD, tuesdayAt(21, 0))).toBe(false)
  })

  it('is true at the exact opening minute', () => {
    expect(computeIsOpenNow(STANDARD, tuesdayAt(9, 0))).toBe(true)
  })

  it('is false when isTemporarilyClosed overrides an in-window time', () => {
    expect(computeIsOpenNow({ ...STANDARD, isTemporarilyClosed: true }, tuesdayAt(15, 0))).toBe(false)
  })

  it('is false on a weekly off day (no hours entry for that day)', () => {
    const { mon: _mon, ...noMonday } = STANDARD
    const monday = new Date(2026, 8, 7) // Mon Sep 7 2026
    monday.setHours(15, 0, 0, 0)
    expect(computeIsOpenNow(noMonday as OpeningHours, monday)).toBe(false)
  })

  it('honours a different window on Sunday', () => {
    const sunday = new Date(2026, 8, 6) // Sun Sep 6 2026
    sunday.setHours(11, 0, 0, 0)
    expect(computeIsOpenNow(STANDARD, sunday)).toBe(true)

    const sundayLate = new Date(2026, 8, 6)
    sundayLate.setHours(18, 0, 0, 0)
    expect(computeIsOpenNow(STANDARD, sundayLate)).toBe(false)
  })

  it('handles an overnight window that wraps past midnight', () => {
    const overnight: OpeningHours = { mon: { open: '22:00', close: '02:00' } }
    const lateNight = new Date(2026, 8, 7)
    lateNight.setHours(23, 30, 0, 0)
    expect(computeIsOpenNow(overnight, lateNight)).toBe(true)

    const earlyMorning = new Date(2026, 8, 7)
    earlyMorning.setHours(1, 30, 0, 0)
    expect(computeIsOpenNow(overnight, earlyMorning)).toBe(true)

    const midday = new Date(2026, 8, 7)
    midday.setHours(12, 0, 0, 0)
    expect(computeIsOpenNow(overnight, midday)).toBe(false)
  })

  it('is false when openingHours is missing entirely', () => {
    expect(computeIsOpenNow(undefined, tuesdayAt(15, 0))).toBe(false)
    expect(computeIsOpenNow(null, tuesdayAt(15, 0))).toBe(false)
  })
})
