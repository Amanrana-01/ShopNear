/** Navrangpura, Ahmedabad — the centre of the seeded neighbourhood. */
export const ANCHOR = { lat: 23.0365, lng: 72.5611 } as const

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/**
 * Move `metres` from a point along `bearingDegrees` (0 = north, 90 = east).
 * Used by the seed to scatter shops 40 m – 2.5 km around the anchor.
 */
export function offsetPoint(
  lat: number, lng: number, metres: number, bearingDegrees: number,
): { lat: number; lng: number } {
  const angular = metres / EARTH_RADIUS_M
  const bearing = toRad(bearingDegrees)
  const lat1 = toRad(lat)
  const lng1 = toRad(lng)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
    Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
    Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
  )

  return { lat: toDeg(lat2), lng: toDeg(lng2) }
}

/**
 * Great-circle distance in metres. Used only by the seed and its tests to
 * verify placement — production distance queries use PostGIS ST_Distance,
 * which accounts for the WGS-84 ellipsoid.
 */
export function haversineMetres(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}
