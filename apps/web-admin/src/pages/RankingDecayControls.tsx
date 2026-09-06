import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { searchLive, getShopById } from '@/api/admin'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IconSearch, IconLoader, IconInfo, IconArrowRight } from '@/components/ui/Icon'
import { AvailabilityBadgePill } from '@/components/StatusBadge'
import { formatDistance, formatRupees } from '@/lib/format'
import {
  DEFAULT_RANKING_WEIGHTS, DEFAULT_DECAY_THRESHOLDS, scoreResult, scoreBreakdown,
  confidenceScoreFromTone, computeBadgePreview,
} from '@/lib/rankingSim'
import type { RankingWeights, DecayThresholds, SearchResultRow, Availability } from '@/types'

const LOCATIONS = [
  { label: 'Navrangpura (seed centre)', lat: 23.0365, lng: 72.5611 },
  { label: 'Wide net — 3 km radius', lat: 23.0365, lng: 72.5611, radius: 3000 },
]

interface EnrichedResult extends SearchResultRow {
  rating: number
  serverScore: number
}

const WEIGHT_LABELS: Record<keyof RankingWeights, string> = {
  availabilityConfidence: 'Availability confidence',
  proximity: 'Proximity',
  shopRating: 'Shop rating',
  isOpenNow: 'Open now',
}
const COMPONENT_COLORS: Record<keyof RankingWeights, string> = {
  availabilityConfidence: '#7B2FBE',
  proximity: '#2DD4BF',
  shopRating: '#A56EE6',
  isOpenNow: '#F59E0B',
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink/70">{label}</span>
        <span className="font-mono text-xs font-semibold text-brand-700">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
    </label>
  )
}

function RankDelta({ before, after }: { before: number; after: number }) {
  const delta = before - after // positive = moved up
  if (delta === 0) return <span className="text-xs text-ink/40">–</span>
  const up = delta > 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-teal-600' : 'text-rose-600'}`}>
      {up ? '▲' : '▼'} {Math.abs(delta)}
    </span>
  )
}

function RankingSection() {
  const [q, setQ] = useState('atta')
  const [locIdx, setLocIdx] = useState(0)
  const [radius, setRadius] = useState(3000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<EnrichedResult[] | null>(null)
  const [weights, setWeights] = useState<RankingWeights>({ ...DEFAULT_RANKING_WEIGHTS })

  async function runSearch() {
    setLoading(true)
    setError(null)
    try {
      const loc = LOCATIONS[locIdx]
      const res = await searchLive(q.trim(), loc.lat, loc.lng, radius, 30)
      const uniqueShopIds = [...new Set(res.results.map((r) => r.shopId))]
      const ratingByShop = new Map<string, number>()
      await Promise.all(uniqueShopIds.map(async (id) => {
        try {
          const shop = await getShopById(id)
          ratingByShop.set(id, shop.avgRating)
        } catch {
          ratingByShop.set(id, 0)
        }
      }))
      const enriched: EnrichedResult[] = res.results.map((r) => ({
        ...r,
        rating: ratingByShop.get(r.shopId) ?? 0,
        serverScore: r.score,
      }))
      setResults(enriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  const ranked = useMemo(() => {
    if (!results) return null
    const loc = LOCATIONS[locIdx]
    const withScores = results.map((r) => ({
      ...r,
      liveScore: scoreResult(
        { confidence: confidenceScoreFromTone(r.badge.tone), distanceM: r.distanceMeters, radiusM: radius, rating: r.rating, isOpenNow: r.isOpenNow },
        weights,
      ),
      breakdown: scoreBreakdown(
        { confidence: confidenceScoreFromTone(r.badge.tone), distanceM: r.distanceMeters, radiusM: radius, rating: r.rating, isOpenNow: r.isOpenNow },
        weights,
      ),
    }))
    const byServerRank = [...withScores].sort((a, b) => b.serverScore - a.serverScore)
    const serverRankOf = new Map(byServerRank.map((r, i) => [`${r.shopId}-${r.product.id}`, i + 1]))
    const byLiveRank = [...withScores].sort((a, b) => b.liveScore - a.liveScore)
    return byLiveRank.map((r, i) => ({
      ...r,
      newRank: i + 1,
      oldRank: serverRankOf.get(`${r.shopId}-${r.product.id}`) ?? i + 1,
    }))
  }, [results, weights, radius, locIdx])

  const chartData = useMemo(() => {
    if (!ranked) return []
    return ranked.slice(0, 10).map((r) => ({
      name: `${r.shopName.slice(0, 16)} · ${formatDistance(r.distanceMeters)}`,
      ...r.breakdown,
    }))
  }, [ranked])

  return (
    <>
      <Card>
        <CardHeader
          title="Live search"
          description="Pulls real results from GET /api/search — the exact endpoint the customer app calls."
          action={
            <Button size="sm" onClick={runSearch} loading={loading}>
              <IconSearch size={14} /> Run search
            </Button>
          }
        />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink/60">Search term</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-40 rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink/60">Location</span>
            <select value={locIdx} onChange={(e) => setLocIdx(Number(e.target.value))} className="rounded-lg border border-brand-200 px-3 py-2 text-sm">
              {LOCATIONS.map((l, i) => <option key={l.label} value={i}>{l.label}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink/60">Radius (m)</span>
            <input type="number" min={250} max={5000} step={250} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-24 rounded-lg border border-brand-200 px-3 py-2 text-sm" />
          </label>
        </div>
        {error && <p className="px-5 pb-4 text-sm text-rose-600">{error}</p>}
      </Card>

      <Card>
        <CardHeader
          title="Ranking weights"
          description="w1·availability + w2·proximity + w3·rating + w4·open-now (spec §8). Drag a slider — re-ranking happens instantly, client-side, over the search results above."
          action={<Button size="sm" variant="outline" onClick={() => setWeights({ ...DEFAULT_RANKING_WEIGHTS })}>Reset to server defaults</Button>}
        />
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          {(Object.keys(weights) as Array<keyof RankingWeights>).map((k) => (
            <WeightSlider key={k} label={WEIGHT_LABELS[k]} value={weights[k]} onChange={(v) => setWeights((w) => ({ ...w, [k]: v }))} />
          ))}
        </div>
        <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50/60 px-5 py-3 text-xs text-amber-800">
          <IconInfo size={14} className="mt-0.5 shrink-0" />
          <span>
            This re-ranks the results already fetched above, live, in your browser — a faithful copy of the server's own scoring formula.
            <strong> It does not persist</strong>: PUT /api/admin/config/ranking-weights does not exist yet, so moving these sliders never
            changes what the customer app itself returns from the server. Run a fresh search after changing weights to see it applied to new results too.
          </span>
        </div>
      </Card>

      {loading && (
        <Card><div className="flex items-center gap-2 px-5 py-10 text-sm text-ink/50"><IconLoader size={16} /> Searching…</div></Card>
      )}

      {!loading && ranked && ranked.length === 0 && (
        <Card><div className="px-5 py-10 text-center text-sm text-ink/50">No results for "{q}" near this location. Try "atta", "dal", "milk", or a wider radius.</div></Card>
      )}

      {!loading && ranked && ranked.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <CardHeader title={`Result order — "${q}"`} description={`${ranked.length} shop/product matches, re-sorted by your weights. Rank change is shown explicitly, not just by position.`} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-brand-50 text-xs uppercase tracking-wide text-ink/45">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Rank</th>
                    <th className="px-4 py-2.5 font-medium">Change</th>
                    <th className="px-4 py-2.5 font-medium">Shop</th>
                    <th className="px-4 py-2.5 font-medium">Product</th>
                    <th className="px-4 py-2.5 font-medium">Price</th>
                    <th className="px-4 py-2.5 font-medium">Distance</th>
                    <th className="px-4 py-2.5 font-medium">Rating</th>
                    <th className="px-4 py-2.5 font-medium">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((r) => (
                    <tr key={`${r.shopId}-${r.product.id}`} className="border-b border-brand-50 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-ink/60">#{r.newRank}</td>
                      <td className="px-4 py-2.5"><RankDelta before={r.oldRank} after={r.newRank} /></td>
                      <td className="px-4 py-2.5 font-medium text-ink">{r.shopName}</td>
                      <td className="px-4 py-2.5 text-ink/70">{r.product.name}</td>
                      <td className="px-4 py-2.5 text-ink/70">{formatRupees(r.price)}</td>
                      <td className="px-4 py-2.5 text-ink/70">{formatDistance(r.distanceMeters)}</td>
                      <td className="px-4 py-2.5 text-ink/70">{r.rating.toFixed(1)}★</td>
                      <td className="px-4 py-2.5"><AvailabilityBadgePill badge={r.badge} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Score composition (top 10)" description="Each bar is one shop/product match's composite score, stacked by weighted component — units are score points (0–1 scale)." />
            <div className="h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE0FC" horizontal={false} />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} label={{ value: 'Composite score', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toFixed(3)} />
                  <Legend formatter={(v: string) => WEIGHT_LABELS[v as keyof RankingWeights] ?? v} />
                  {(Object.keys(WEIGHT_LABELS) as Array<keyof RankingWeights>).map((k) => (
                    <Bar key={k} dataKey={k} stackId="score" fill={COMPONENT_COLORS[k]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </>
  )
}

function DecaySection() {
  const [thresholds, setThresholds] = useState<DecayThresholds>({ ...DEFAULT_DECAY_THRESHOLDS })
  const [availability, setAvailability] = useState<Availability>('IN_STOCK')
  const [ageHours, setAgeHours] = useState(1)

  const badge = computeBadgePreview(availability, ageHours, thresholds)

  return (
    <Card>
      <CardHeader
        title="Decay threshold preview"
        description="Shows exactly how a badge would look for a given availability + age, using the same rule table as apps/api/src/modules/availability/confidence.ts (spec §7)."
        action={<Button size="sm" variant="outline" onClick={() => setThresholds({ ...DEFAULT_DECAY_THRESHOLDS })}>Reset to server defaults</Button>}
      />
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/60">"In stock" → "Likely available" after (hours)</span>
            <input type="range" min={0.5} max={12} step={0.5} value={thresholds.inStockFreshHours} onChange={(e) => setThresholds((t) => ({ ...t, inStockFreshHours: Number(e.target.value) }))} className="w-full accent-brand-500" />
            <span className="font-mono text-xs text-brand-700">{thresholds.inStockFreshHours} h</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/60">"Likely available" → "Usually available" after (hours)</span>
            <input type="range" min={4} max={72} step={1} value={thresholds.inStockStaleHours} onChange={(e) => setThresholds((t) => ({ ...t, inStockStaleHours: Number(e.target.value) }))} className="w-full accent-brand-500" />
            <span className="font-mono text-xs text-brand-700">{thresholds.inStockStaleHours} h</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/60">"Out of stock" trusted for (hours)</span>
            <input type="range" min={1} max={48} step={1} value={thresholds.outOfStockTrustHours} onChange={(e) => setThresholds((t) => ({ ...t, outOfStockTrustHours: Number(e.target.value) }))} className="w-full accent-brand-500" />
            <span className="font-mono text-xs text-brand-700">{thresholds.outOfStockTrustHours} h</span>
          </label>
        </div>
        <div className="flex flex-col gap-4 rounded-lg bg-brand-50/50 p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/60">Merchant last said</span>
            <select value={availability} onChange={(e) => setAvailability(e.target.value as Availability)} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm">
              <option value="IN_STOCK">In stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
              <option value="USUALLY_AVAILABLE">Usually available</option>
              <option value="UNKNOWN">Unknown / no record</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink/60">…that long ago</span>
            <input type="range" min={0} max={48} step={0.5} value={ageHours} onChange={(e) => setAgeHours(Number(e.target.value))} className="w-full accent-brand-500" />
            <span className="font-mono text-xs text-brand-700">{ageHours} h ago</span>
          </label>
          <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-brand-200 bg-white p-5">
            <AvailabilityBadgePill badge={badge} />
          </div>
          <p className="text-center text-xs text-ink/50">This is the badge a customer would see, given these inputs.</p>
        </div>
      </div>
      <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50/60 px-5 py-3 text-xs text-amber-800">
        <IconInfo size={14} className="mt-0.5 shrink-0" />
        <span>
          Preview only. <span className="font-mono">GET/PUT /api/admin/config/decay-thresholds</span> do not exist, so this cannot read the
          live persisted thresholds (it starts from the compiled-in defaults in <span className="font-mono">apps/api/src/config/constants.ts</span>)
          or write changes back to affect the real decay job.
        </span>
      </div>
    </Card>
  )
}

export default function RankingDecayControls() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Ranking &amp; decay controls</h1>
        <p className="mt-1 text-sm text-ink/55">
          Search ranking weights (spec §8) and availability decay thresholds (spec §7). The live re-ranking below runs against
          real search results — moving a slider visibly reorders them.
        </p>
      </div>
      <RankingSection />
      <DecaySection />
    </div>
  )
}
