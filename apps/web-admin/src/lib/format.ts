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
  if (days < 30) return `${days} d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
