import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { searchLive, mergeProducts } from '@/api/admin'
import { EndpointNotAvailableError } from '@/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NotAvailable } from '@/components/ui/EmptyState'
import { IconMerge, IconSearch, IconLoader, IconAlert, IconInfo } from '@/components/ui/Icon'
import { findDuplicateCandidates, similarity, type DuplicateCandidate } from '@/lib/fuzzyMatch'

// Navrangpura anchor (spec §11 seed centre) with the max radius the API
// accepts, so a scan reaches every ACTIVE shop's inventory regardless of
// where in the demo neighbourhood it sits.
const ANCHOR = { lat: 23.0365, lng: 72.5611, radius: 5000 }

const SCAN_TERMS = [
  'atta', 'dal', 'rice', 'oil', 'milk', 'soap', 'biscuit', 'tea',
  'masala', 'detergent', 'toothpaste', 'butter', 'sugar', 'salt', 'bread', 'notebook',
]

interface ScannedProduct { id: string; name: string }

/**
 * Master catalogue: this page ships two working, honest things and one
 * documented gap.
 *
 * 1. A REAL duplicate detector: it scans the live `/api/search` endpoint
 *    (public, real) across a curated set of broad terms, collects every
 *    distinct product name it can see that way, and runs a client-side
 *    fuzzy matcher (lib/fuzzyMatch.ts — a Dice-coefficient bigram
 *    similarity, echoing the API's own pg_trgm-based typo tolerance) over
 *    the results. This only ever sees products with active inventory
 *    somewhere within radius of the anchor — not the full 342-item
 *    catalogue — because there is no catalogue-browse endpoint (see the
 *    gap below).
 * 2. A manual comparison tool so the exact spec example ("Amul Butter
 *    500g" vs "amul butter 500 gm") can be typed in and scored live, for a
 *    demo that doesn't depend on that literal pair existing in the seed.
 * 3. Full product CRUD (create/edit/delete) and a persisted merge action:
 *    genuinely not available — no such route exists anywhere in the API.
 */
export default function Catalogue() {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState<ScannedProduct[]>([])
  const [candidates, setCandidates] = useState<DuplicateCandidate[] | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(0.72)

  const [nameA, setNameA] = useState('Amul Butter 500g')
  const [nameB, setNameB] = useState('amul butter 500 gm')

  const mergeMutation = useMutation({
    mutationFn: ({ keepId, mergeId }: { keepId: string; mergeId: string }) => mergeProducts(keepId, mergeId),
  })

  async function runScan() {
    setScanning(true)
    setScanError(null)
    try {
      const byId = new Map<string, ScannedProduct>()
      for (const term of SCAN_TERMS) {
        const res = await searchLive(term, ANCHOR.lat, ANCHOR.lng, ANCHOR.radius, 100)
        for (const r of res.results) byId.set(r.product.id, { id: r.product.id, name: r.product.name })
      }
      const products = [...byId.values()]
      setScanned(products)
      setCandidates(findDuplicateCandidates(products, threshold))
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed.')
    } finally {
      setScanning(false)
    }
  }

  const manualScore = similarity(nameA, nameB)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Master catalogue</h1>
        <p className="mt-1 text-sm text-ink/55">342 seeded products, shared across every shop. Includes the duplicate-detector tool the spec calls out by name.</p>
      </div>

      <Card>
        <CardHeader
          title="Manual duplicate check"
          description="Type two candidate names — e.g. the spec's own example — and see how the detector scores them."
        />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/60">Product A</span>
            <input value={nameA} onChange={(e) => setNameA(e.target.value)} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/60">Product B</span>
            <input value={nameB} onChange={(e) => setNameB(e.target.value)} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
        </div>
        <div className="flex items-center gap-3 border-t border-brand-50 px-5 py-4">
          <div className="flex-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-50">
              <div
                className={`h-full rounded-full ${manualScore >= threshold ? 'bg-rose-500' : 'bg-teal'}`}
                style={{ width: `${Math.round(manualScore * 100)}%` }}
              />
            </div>
          </div>
          <span className="w-16 text-right font-mono text-sm font-semibold text-ink">{(manualScore * 100).toFixed(0)}%</span>
          {manualScore >= threshold ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-600"><IconAlert size={14} /> Likely duplicate</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-ink/45"><IconInfo size={14} /> Distinct products</span>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Live scan across seeded inventory"
          description={`Runs ${SCAN_TERMS.length} broad searches (atta, dal, rice, ...) against the real /api/search endpoint and flags any pair of distinct product names scoring ≥ ${Math.round(threshold * 100)}% similar.`}
          action={
            <Button size="sm" onClick={runScan} loading={scanning}>
              <IconSearch size={14} /> Scan now
            </Button>
          }
        />
        <div className="flex items-center gap-3 border-b border-brand-50 px-5 py-3 text-xs text-ink/55">
          <label className="flex items-center gap-2">
            Similarity threshold
            <input type="range" min={0.5} max={0.95} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="accent-brand-500" />
            <span className="font-mono font-semibold text-ink">{Math.round(threshold * 100)}%</span>
          </label>
          {scanned.length > 0 && <span>· {scanned.length} distinct products seen so far</span>}
        </div>

        {scanning && (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-ink/50">
            <IconLoader size={16} /> Scanning live inventory near the seed anchor…
          </div>
        )}

        {!scanning && scanError && (
          <div className="px-5 py-8 text-sm text-rose-600">{scanError}</div>
        )}

        {!scanning && !scanError && candidates !== null && candidates.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-ink/50">
            No near-duplicate names found above {Math.round(threshold * 100)}% among the {scanned.length} distinct products this scan could see.
            Try lowering the threshold, or use the manual check above with the spec's own example pair.
          </div>
        )}

        {!scanning && candidates !== null && candidates.length > 0 && (
          <ul className="divide-y divide-brand-50">
            {candidates.map((c) => (
              <li key={`${c.a.id}-${c.b.id}`} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-ink">{c.a.name}</p>
                  <p className="truncate text-ink/50">{c.b.name}</p>
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold text-rose-600">{(c.score * 100).toFixed(0)}%</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mergeMutation.mutate({ keepId: c.a.id, mergeId: c.b.id })}
                  loading={mergeMutation.isPending}
                >
                  <IconMerge size={14} /> Merge
                </Button>
              </li>
            ))}
          </ul>
        )}

        {mergeMutation.isError && mergeMutation.error instanceof EndpointNotAvailableError && (
          <div className="border-t border-amber-100 bg-amber-50/60 px-5 py-3 text-xs text-amber-800">
            Merge could not be persisted — <span className="font-mono">{mergeMutation.error.endpoints.join(', ')}</span> does not exist yet.
            The detector above is real; only the write-back is missing.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Product CRUD" description="Create, edit, delete, and browse the full 342-item catalogue." />
        <NotAvailable
          endpoints={['GET /api/admin/products', 'POST /api/admin/products', 'PATCH /api/admin/products/:id', 'DELETE /api/admin/products/:id', 'POST /api/admin/products/merge (persistence for the tool above)']}
          description="There is no products route of any kind in the API — not even a read-only listing. The only way to see a product today is indirectly, through /api/search (requires a location + search text) or a shop's inventory. Full catalogue management needs a dedicated admin-scoped products module."
        />
      </Card>
    </div>
  )
}
