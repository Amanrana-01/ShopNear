/** Small, dependency-free helpers shared by the fixture data and mockClient.
 * Deliberately not imported from apps/api — the web app must stand alone. */

export const ANCHOR = { lat: 23.0365, lng: 72.5611 } as const

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

export function offsetPoint(
  lat: number, lng: number, metres: number, bearingDegrees: number,
): { lat: number; lng: number } {
  const angular = metres / EARTH_RADIUS_M
  const bearing = toRad(bearingDegrees)
  const lat1 = toRad(lat)
  const lng1 = toRad(lng)
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
    Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
  )
  return { lat: toDeg(lat2), lng: toDeg(lng2) }
}

export function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

/** Deterministic PRNG (mulberry32) so the same "random" fixture data is
 * stable across reloads and between the server (if any) and the client. */
export function mulberry32(seed: number) {
  let a = seed
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededRandomFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return mulberry32(h)
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function sample<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}

export function slugToId(prefix: string, slug: string): string {
  const cleaned = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${prefix}_${cleaned}`
}

/** Inline SVG data URI placeholder — an initial on a tinted ground, hue
 * derived from the category so the fallback tile stays visually consistent
 * across a dense product grid instead of looking like an error state. */
export function placeholderSvgDataUri(label: string, hue: number): string {
  const initial = (label.trim()[0] ?? '?').toUpperCase()
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<rect width="160" height="160" rx="24" fill="hsl(${hue} 62% 92%)"/>` +
    `<text x="80" y="80" font-family="system-ui,sans-serif" font-size="64" font-weight="600" ` +
    `fill="hsl(${hue} 45% 42%)" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Simulated network latency so loading skeletons are actually visible
 * instead of resolving in the same frame. Slightly randomised per call. */
export function latency(baseMs = 260, jitterMs = 260): Promise<void> {
  const ms = baseMs + Math.random() * jitterMs
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let counter = 0
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}
