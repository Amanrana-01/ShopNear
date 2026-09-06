export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`
}

/** "just now" / "20 min ago" / "3 h ago" / "2 d ago". */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  const diffMs = Math.max(0, now - then)
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} d ago`
  const weeks = Math.round(days / 7)
  return `${weeks}w ago`
}

/** mm:ss / h:mm:ss countdown used by the reservation-expiry timer. */
export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Great-circle distance in metres — used only for the client-side
 * "pin looks far from your detected location" registration warning; every
 * server-side distance in this app comes from the API's own PostGIS query. */
export function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
