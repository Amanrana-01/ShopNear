/**
 * Open Food Facts client: cached, paced, and polite.
 *
 * Every raw API response is written to `.cache/off/` so a re-run costs nothing
 * and the matcher can be re-tuned offline without touching the network again —
 * which is the whole point of a build-time script.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { OffCandidate } from './match'

export const USER_AGENT =
  'ShopNear-demo/1.0 (build-time catalogue image sourcing; contact via repository)'

/**
 * DO NOT LOWER. Measured, not guessed.
 *
 * Open Food Facts documents roughly 100 req/min for the product endpoint but
 * only ~10 req/min for *search*. At 2 req/s the search endpoint returns a
 * transient 503 on a large fraction of calls: an earlier run at that rate lost
 * 32 entire brands - Amul among them - and the failures are silent unless you
 * are watching, because each one just looks like "that brand has no products".
 *
 * 6 s between searches is what the service actually tolerates. The 2 req/s
 * figure is correct for the image CDN and is used by IMAGE_INTERVAL_MS below.
 */
export const SEARCH_INTERVAL_MS = 6_000
export const IMAGE_INTERVAL_MS = 500

export type OffHost = 'food' | 'beauty' | 'products'

const HOSTS: Record<OffHost, string> = {
  food: 'https://world.openfoodfacts.org',
  beauty: 'https://world.openbeautyfacts.org',
  products: 'https://world.openproductsfacts.org',
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

interface OffSelectedImage {
  display?: Record<string, string>
  full?: Record<string, string>
  small?: Record<string, string>
}

interface OffRawProduct {
  code?: string
  product_name?: string
  brands?: string
  quantity?: string
  countries_tags?: string[]
  selected_images?: { front?: OffSelectedImage }
  image_front_url?: string
}

interface OffSearchResponse {
  count?: number
  products?: OffRawProduct[]
}

/**
 * The front image, preferring the English then Indian language key, and the
 * `display` size over `full` (full is often 3000px of nothing extra).
 */
export function frontImageOf(raw: OffRawProduct): { url: string | null; lang: string | null } {
  const front = raw.selected_images?.front
  for (const size of ['display', 'full', 'small'] as const) {
    const bucket = front?.[size]
    if (!bucket) continue
    for (const lang of ['en', 'in', 'hi', 'gu']) {
      const url = bucket[lang]
      if (url) return { url, lang }
    }
    const first = Object.entries(bucket)[0]
    if (first) return { url: first[1], lang: first[0] }
  }
  // Older records carry only the flat field.
  return raw.image_front_url ? { url: raw.image_front_url, lang: null } : { url: null, lang: null }
}

export function toCandidate(raw: OffRawProduct): OffCandidate {
  const { url, lang } = frontImageOf(raw)
  return {
    code: raw.code ?? '',
    productName: raw.product_name ?? '',
    brands: (raw.brands ?? '').split(',').map((b) => b.trim()).filter(Boolean),
    quantity: raw.quantity ?? null,
    countries: raw.countries_tags ?? [],
    imageUrl: url,
    imageLang: lang,
  }
}

const FIELDS = [
  'code', 'product_name', 'brands', 'quantity', 'countries_tags',
  'selected_images', 'image_front_url',
].join(',')

export interface OffClientOptions {
  cacheDir: string
  /** Set false to fail rather than hit the network — used by tests. */
  allowNetwork?: boolean
  searchIntervalMs?: number
}

export class OffClient {
  private lastRequestAt = 0
  private readonly cacheDir: string
  private readonly allowNetwork: boolean
  private readonly searchIntervalMs: number

  constructor(opts: OffClientOptions) {
    this.cacheDir = opts.cacheDir
    this.allowNetwork = opts.allowNetwork ?? true
    this.searchIntervalMs = opts.searchIntervalMs ?? SEARCH_INTERVAL_MS
    if (!existsSync(this.cacheDir)) mkdirSync(this.cacheDir, { recursive: true })
  }

  private cachePath(key: string): string {
    return join(this.cacheDir, `${key.replace(/[^a-z0-9._-]+/gi, '_')}.json`)
  }

  private async pace(): Promise<void> {
    const wait = this.lastRequestAt + this.searchIntervalMs - Date.now()
    if (wait > 0) await sleep(wait)
    this.lastRequestAt = Date.now()
  }

  /**
   * Every product a brand has on one server. One search per brand rather than
   * one per item: the candidate pool is identical, and it is ~150 requests
   * instead of ~470 against an endpoint that rate-limits at ten a minute.
   */
  async searchByBrand(host: OffHost, brand: string, page = 1): Promise<OffCandidate[]> {
    const tag = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const key = `${host}_${tag}_p${page}`
    const path = this.cachePath(key)

    if (existsSync(path)) {
      const cached = JSON.parse(readFileSync(path, 'utf8')) as OffSearchResponse
      return (cached.products ?? []).map(toCandidate)
    }
    if (!this.allowNetwork) return []

    const url =
      `${HOSTS[host]}/api/v2/search?brands_tags=${encodeURIComponent(tag)}` +
      `&fields=${FIELDS}&page_size=100&page=${page}`

    let lastError: unknown
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await sleep(10_000 * attempt)
      await this.pace()
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as OffSearchResponse
        writeFileSync(path, JSON.stringify(json), 'utf8')
        return (json.products ?? []).map(toCandidate)
      } catch (err) {
        lastError = err
      }
    }
    throw new Error(
      `OFF search failed for ${brand} @ ${host}: ${String(lastError)}`,
    )
  }
}
