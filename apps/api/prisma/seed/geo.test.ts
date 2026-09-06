import { describe, it, expect } from 'vitest'
import { ANCHOR, offsetPoint, haversineMetres } from './geo'

describe('geography helpers', () => {
  it('anchors on Navrangpura, Ahmedabad', () => {
    expect(ANCHOR.lat).toBeCloseTo(23.0365, 4)
    expect(ANCHOR.lng).toBeCloseTo(72.5611, 4)
  })

  it('offsets a point by roughly the requested distance', () => {
    const p = offsetPoint(ANCHOR.lat, ANCHOR.lng, 500, 90)
    const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, p.lat, p.lng)
    expect(d).toBeGreaterThan(495)
    expect(d).toBeLessThan(505)
  })

  it('offsets correctly at several bearings', () => {
    for (const bearing of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const p = offsetPoint(ANCHOR.lat, ANCHOR.lng, 1200, bearing)
      const d = haversineMetres(ANCHOR.lat, ANCHOR.lng, p.lat, p.lng)
      expect(d).toBeGreaterThan(1180)
      expect(d).toBeLessThan(1220)
    }
  })

  it('measures zero distance from a point to itself', () => {
    expect(haversineMetres(23.0365, 72.5611, 23.0365, 72.5611)).toBeCloseTo(0, 5)
  })
})
