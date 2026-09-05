import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { MultiItemSearchResponse, ShopCoverage } from '@shopnear/shared'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { RadiusControl } from '@/components/RadiusControl'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { AddToCartControl } from '@/components/AddToCartControl'
import { formatDistance, formatRupees } from '@/lib/format'
import { IconCheckCircle, IconX, IconArrowRight } from '@/components/ui/Icon'
import { Link } from 'react-router-dom'

const EXAMPLE = 'atta, doodh, Maggi, sabun'

function CoverageCard({ coverage, highlight }: { coverage: ShopCoverage; highlight?: boolean }) {
  return (
    <div className={`rounded-card p-4 shadow-soft ${highlight ? 'border-2 border-brand bg-brand-50/40' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to={`/shop/${coverage.shop.id}`} className="font-display text-[15px] font-bold text-ink hover:underline">
            {coverage.shop.name}
          </Link>
          <p className="text-xs text-ink/50">{formatDistance(coverage.shop.distanceMeters)} away</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-brand-700">{coverage.coveragePercent}%</p>
          <p className="text-[11px] text-ink/45">{coverage.coveredCount}/{coverage.totalCount} items</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {coverage.itemsCovered.map((item) => (
          <li key={item.queryText} className="flex items-center justify-between gap-2 rounded-xl bg-teal-50/60 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
              <IconCheckCircle size={15} className="shrink-0 text-teal-600" />
              <span className="truncate">
                <span className="font-medium">{item.queryText}</span>
                <span className="text-ink/45"> · {item.product.name}</span>
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-ink">{formatRupees(item.offer.price)}</span>
          </li>
        ))}
        {coverage.itemsMissing.map((text) => (
          <li key={text} className="flex items-center gap-2 rounded-xl bg-rose-50/60 px-3 py-2 text-sm text-rose-700">
            <IconX size={15} className="shrink-0" />
            <span className="truncate">{text} — not available here</span>
          </li>
        ))}
      </ul>

      {coverage.estimatedTotal > 0 && (
        <p className="mt-3 text-sm font-semibold text-ink">Estimated total: {formatRupees(coverage.estimatedTotal)}</p>
      )}
    </div>
  )
}

export default function MultiItemSearch() {
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [text, setText] = useState('')
  const [result, setResult] = useState<MultiItemSearchResponse | null>(null)

  const mutation = useMutation({
    mutationFn: (items: string[]) => api.multiItemSearch({
      location: { lat: location!.lat, lng: location!.lng }, radiusMeters, items,
    }),
    onSuccess: setResult,
  })

  function run(raw: string) {
    const items = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    if (items.length === 0) return
    setResult(null)
    mutation.mutate(items)
  }

  return (
    <div>
      <PageHeader title="Shopping list" />
      <div className="px-4 pt-3">
        <p className="mb-3 text-sm text-ink/60">
          List everything you need, separated by commas — we'll find the single nearby shop that covers the most of it,
          or split it across two if nobody has it all.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`e.g. ${EXAMPLE}`}
          rows={3}
          className="w-full resize-none rounded-2xl border border-black/10 p-4 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <RadiusControl value={radiusMeters} onChange={setRadiusMeters} />
          <Button size="sm" onClick={() => run(text)} loading={mutation.isPending} disabled={!text.trim()}>
            Find my shop <IconArrowRight size={16} />
          </Button>
        </div>
        {!text && (
          <button type="button" onClick={() => { setText(EXAMPLE); run(EXAMPLE) }} className="mt-2 text-xs font-semibold text-brand-700 underline decoration-dotted">
            Try the example list
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4 px-4 pb-8">
        {mutation.isPending && (
          <div className="animate-pulse rounded-card bg-white p-6 text-center text-sm text-ink/50 shadow-soft">
            Checking every shop within {formatDistance(radiusMeters)}…
          </div>
        )}

        {result?.bestSingleShop && (
          <section>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">Best single shop</h2>
            <CoverageCard coverage={result.bestSingleShop} highlight />
          </section>
        )}

        {result?.twoShopSplit && (
          <section>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
              Or split across two shops ({result.twoShopSplit.combinedCoveredCount}/{result.matches.length} covered)
            </h2>
            <div className="flex flex-col gap-3">
              <CoverageCard coverage={result.twoShopSplit.primary} />
              <CoverageCard coverage={result.twoShopSplit.secondary} />
            </div>
            {result.twoShopSplit.stillMissing.length > 0 && (
              <p className="mt-2 text-xs text-ink/50">
                Still not found nearby: {result.twoShopSplit.stillMissing.join(', ')}
              </p>
            )}
          </section>
        )}

        {result?.otherShops && result.otherShops.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">Other nearby options</h2>
            <div className="flex flex-col gap-3">
              {result.otherShops.map((c) => <CoverageCard key={c.shop.id} coverage={c} />)}
            </div>
          </section>
        )}

        {result && !result.bestSingleShop && (
          <div className="rounded-card bg-white p-6 text-center text-sm text-ink/55 shadow-soft">
            No shops found within {formatDistance(radiusMeters)}. Try a wider radius.
          </div>
        )}
      </div>
    </div>
  )
}
