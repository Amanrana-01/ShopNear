import { describe, it, expect } from 'vitest'
import { SHOP_TYPES } from '@shopnear/shared'
import { SHOPS } from './shops'
import { DEMO_ORIGINS } from './origins'
import { haversineMetres } from './helpers'
import { nearestDemoOrigin } from '../../lib/demoLocation'

/**
 * No rung of the radius picker is ever empty.
 *
 * The reported bug: 250 m, 500 m, 1 km and 3 km all returned zero shops. The
 * coordinates were never wrong — browsing was anchored to the device's real
 * position, which is nowhere near the fixture. `resolveDemoLocation` snaps a
 * stray device position to the nearest demo origin, so the set of places a
 * customer can browse from is exactly DEMO_ORIGINS, and this asserts the
 * guarantee at every one of them.
 *
 * Cumulative floors, per origin, matching the agreed distribution.
 */

const BUCKETS: { radius: number; min: number }[] = [
  { radius: 250, min: 4 },
  { radius: 500, min: 8 },
  { radius: 1_000, min: 12 },
  { radius: 3_000, min: 18 },
  { radius: 10_000, min: 25 },
  { radius: 25_000, min: SHOPS.length },
]

const within = (origin: { lat: number; lng: number }, radius: number) =>
  SHOPS.filter((s) => haversineMetres(origin.lat, origin.lng, s.lat!, s.lng!) <= radius)

describe.each(DEMO_ORIGINS)('browsing from $label', (origin) => {
  it.each(BUCKETS)('has at least $min shops within $radius m', ({ radius, min }) => {
    expect(within(origin, radius).length).toBeGreaterThanOrEqual(min)
  })

  it.each(BUCKETS)('has every shop type within $radius m', ({ radius }) => {
    const present = new Set(within(origin, radius).map((s) => s.type))
    const missing = SHOP_TYPES.filter((t) => !present.has(t))
    expect(missing).toEqual([])
  })
})

describe('device positions outside the demo area', () => {
  it('snaps to a demo origin so the tight rungs are never empty', () => {
    // Mumbai, and a point 5 km up the road in Ahmedabad — both far enough out
    // that every rung below 10 km was empty before.
    for (const stray of [{ lat: 19.076, lng: 72.8777 }, { lat: 23.08, lng: 72.60 }]) {
      const { origin, distanceMetres } = nearestDemoOrigin(stray)
      expect(distanceMetres).toBeGreaterThan(250)
      expect(within(origin, 250).length).toBeGreaterThanOrEqual(4)
    }
  })
})
