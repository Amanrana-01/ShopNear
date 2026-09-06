import type { GeoPoint } from '@shopnear/shared'
import { DEMO_ORIGINS } from '../api/fixtures/origins'
import { haversineMetres } from '../api/fixtures/helpers'

/**
 * Keeps browsing inside the demo neighbourhood.
 *
 * Every shop in the mock fixture is placed around one of three points in
 * Navrangpura. "Use my current location" hands back wherever the device
 * actually is, and haversine does the rest: a customer in another part of the
 * city — never mind another city — is tens of kilometres from the fixture, so
 * the radius picker's inner rungs return nothing and the feed empties out.
 * That was the reported bug, and no amount of regenerating coordinates around
 * a fixed anchor fixes it.
 *
 * So a device position outside the neighbourhood is snapped to the nearest
 * demo origin, and the sublabel says so rather than pretending. The three
 * presets already sit exactly on their origins, so this is a no-op for them
 * and they keep their genuinely different distances.
 *
 * Only applies to the mock. Against a real backend the customer's real
 * position is the whole point, so this returns the location untouched.
 */

// Relative rather than the usual `@/` alias: this module is pulled into the
// fixture test suite, which runs under the repo-root vitest config where three
// apps would each claim `@`.
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

/** The tightest rung the radius picker offers. Inside this of an origin, the
 * fixture has shops at every rung; outside it, the tight rungs are empty. */
const NEIGHBOURHOOD_RADIUS_M = 250

export interface ResolvableLocation extends GeoPoint {
  label: string
  sublabel?: string
}

export function nearestDemoOrigin(point: GeoPoint) {
  let best = DEMO_ORIGINS[0]
  let bestDistance = Infinity
  for (const origin of DEMO_ORIGINS) {
    const d = haversineMetres(point.lat, point.lng, origin.lat, origin.lng)
    if (d < bestDistance) {
      bestDistance = d
      best = origin
    }
  }
  return { origin: best, distanceMetres: bestDistance }
}

export function resolveDemoLocation<T extends ResolvableLocation>(loc: T): T {
  if (!useMock) return loc
  const { origin, distanceMetres } = nearestDemoOrigin(loc)
  if (distanceMetres <= NEIGHBOURHOOD_RADIUS_M) return loc
  return {
    ...loc,
    lat: origin.lat,
    lng: origin.lng,
    sublabel: `Outside the demo area — showing ${origin.street}, Navrangpura`,
  }
}
