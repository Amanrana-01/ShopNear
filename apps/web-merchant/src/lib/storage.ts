/**
 * Every localStorage read/write in the app funnels through here, wrapped in
 * try/catch — private browsing / storage-disabled sessions must degrade
 * gracefully (session just won't persist a reload) rather than crash.
 */
const PREFIX = 'shopnear_merchant.'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* ignore — storage unavailable */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}
