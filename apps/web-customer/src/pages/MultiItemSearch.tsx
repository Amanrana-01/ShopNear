import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Check, X, ArrowRight, Sparkles, Split, Footprints, Timer } from 'lucide-react'
import type { MultiItemSearchResponse, ShopCoverage } from '@shopnear/shared'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { RadiusControl } from '@/components/RadiusControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDistance, formatRupees } from '@/lib/format'
import { shopMeta, walkMinutes, formatMinutes } from '@/lib/shopMeta'
import { itemVariants, listVariants, fadeUp, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'atta, doodh, Maggi, sabun',
  'toor dal, chawal, tel, namak',
  'bread, butter, eggs, chai',
  'notebook, pen, eraser',
]

/**
 * The feature this product is actually about: paste a whole list, get told
 * which single shop covers the most of it.
 *
 * Coverage is expressed twice — as a percentage ring and as an itemised
 * ticked/crossed list — because the number alone doesn't tell you *which*
 * thing you'd have to go elsewhere for, and that is usually the deciding
 * factor.
 */

function CoverageRing({ percent }: { percent: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const tone = percent === 100 ? 'text-success-600' : percent >= 60 ? 'text-brand-500' : 'text-amber-500'

  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={radius} className="stroke-black/8" strokeWidth="5" fill="none" />
        <motion.circle
          cx="24" cy="24" r={radius}
          className={cn('stroke-current', tone)}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-black tabular-nums text-ink">
        {percent}%
      </span>
    </div>
  )
}

function CoverageCard({ coverage, highlight }: { coverage: ShopCoverage; highlight?: boolean }) {
  const meta = shopMeta(coverage.shop.type)
  const m = useAppMotion()

  return (
    <motion.div
      variants={m.variants(itemVariants)}
      className={cn(
        'rounded-card p-4 shadow-tile',
        highlight ? 'bg-white ring-2 ring-brand' : 'bg-white',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', meta.tile)}>
          <meta.Icon size={20} strokeWidth={1.7} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <Link
            to={`/shop/${coverage.shop.id}`}
            className="truncate font-display text-[15px] font-extrabold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {coverage.shop.name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-muted">
            <span className="inline-flex items-center gap-1 font-bold text-ink">
              <Timer size={11} strokeWidth={2.5} className="text-success-600" aria-hidden />
              {formatMinutes(walkMinutes(coverage.shop.distanceMeters))} walk
            </span>
            <span className="inline-flex items-center gap-1">
              <Footprints size={11} aria-hidden />
              {formatDistance(coverage.shop.distanceMeters)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-[11px] font-semibold text-ink-faint">
              {coverage.coveredCount}/{coverage.totalCount} items
            </p>
            {coverage.estimatedTotal > 0 && (
              <p className="text-sm font-black text-ink">≈ {formatRupees(coverage.estimatedTotal)}</p>
            )}
          </div>
          <CoverageRing percent={coverage.coveragePercent} />
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {coverage.itemsCovered.map((item) => (
          <li
            key={item.queryText}
            className="flex items-center justify-between gap-2 rounded-lg bg-success-50/70 px-2.5 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2 text-[13px]">
              <Check size={14} strokeWidth={3} className="shrink-0 text-success-700" aria-hidden />
              <span className="truncate">
                <span className="font-bold text-ink">{item.queryText}</span>
                <span className="text-ink-muted"> · {item.product.name}</span>
              </span>
            </span>
            <span className="shrink-0 text-[13px] font-black text-ink">
              {formatRupees(item.offer.price)}
            </span>
          </li>
        ))}
        {coverage.itemsMissing.map((text) => (
          <li
            key={text}
            className="flex items-center gap-2 rounded-lg bg-rose-50/70 px-2.5 py-1.5 text-[13px] text-rose-700"
          >
            <X size={14} strokeWidth={3} className="shrink-0" aria-hidden />
            <span className="truncate">
              <span className="font-bold">{text}</span> — not stocked here
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function MultiItemSearch() {
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [text, setText] = useState('')
  const [result, setResult] = useState<MultiItemSearchResponse | null>(null)
  const m = useAppMotion()

  const mutation = useMutation({
    mutationFn: (items: string[]) => api.multiItemSearch({
      location: { lat: location!.lat, lng: location!.lng }, radiusMeters, items,
    }),
    onSuccess: setResult,
  })

  const itemCount = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).length

  function run(raw: string) {
    const items = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    if (items.length === 0) return
    setResult(null)
    mutation.mutate(items)
  }

  return (
    <div className="pb-10">
      <PageHeader title="Shopping list" subtitle="Find the one shop that has it all" />

      <div className="px-4 pt-3 lg:mx-auto lg:max-w-2xl lg:px-0">
        <div className="rounded-card bg-white p-4 shadow-tile">
          <label htmlFor="list-input" className="text-[13px] font-bold text-ink">
            What do you need?
          </label>
          <p className="mt-0.5 text-xs text-ink-muted">
            One item per line or separated by commas — English, Hindi or Gujarati all work.
          </p>

          <textarea
            id="list-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`e.g. ${EXAMPLES[0]}`}
            rows={4}
            className="mt-2.5 w-full resize-none rounded-xl border border-black/10 bg-canvas p-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <RadiusControl value={radiusMeters} onChange={setRadiusMeters} />
            <Button
              onClick={() => run(text)}
              loading={mutation.isPending}
              disabled={itemCount === 0}
            >
              {itemCount > 0 ? `Find a shop for ${itemCount}` : 'Find my shop'}
              <ArrowRight size={16} aria-hidden />
            </Button>
          </div>

          {!text && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setText(ex); run(ex) }}
                  className="rounded-pill border border-dashed border-brand-200 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-6 px-4 lg:mx-auto lg:max-w-2xl lg:px-0">
        {mutation.isPending && (
          <div className="flex flex-col gap-2.5">
            <p className="text-center text-[13px] font-semibold text-ink-muted">
              Checking every shop within {formatDistance(radiusMeters)}…
            </p>
            {[0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-card" />)}
          </div>
        )}

        <AnimatePresence>
          {result?.bestSingleShop && (
            <motion.section
              variants={m.variants(fadeUp)}
              initial="hidden"
              animate="show"
              key="best"
            >
              <h2 className="mb-2 flex items-center gap-1.5 text-2xs font-black uppercase tracking-wider text-brand-700">
                <Sparkles size={13} aria-hidden />
                Best single shop
              </h2>
              <motion.div variants={m.variants(listVariants)} initial="hidden" animate="show">
                <CoverageCard coverage={result.bestSingleShop} highlight />
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {result?.twoShopSplit && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-2xs font-black uppercase tracking-wider text-ink-faint">
              <Split size={13} aria-hidden />
              Or split across two shops — {result.twoShopSplit.combinedCoveredCount}/
              {result.matches.length} covered
            </h2>
            <motion.div
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2.5"
            >
              <CoverageCard coverage={result.twoShopSplit.primary} />
              <CoverageCard coverage={result.twoShopSplit.secondary} />
            </motion.div>
            {result.twoShopSplit.stillMissing.length > 0 && (
              <p className="mt-2 rounded-lg bg-canvas-sunken px-3 py-2 text-xs text-ink-muted">
                Still not found nearby: {result.twoShopSplit.stillMissing.join(', ')}
              </p>
            )}
          </section>
        )}

        {result && result.otherShops.length > 0 && (
          <section>
            <h2 className="mb-2 text-2xs font-black uppercase tracking-wider text-ink-faint">
              Other nearby options
            </h2>
            <motion.div
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2.5"
            >
              {result.otherShops.map((c) => <CoverageCard key={c.shop.id} coverage={c} />)}
            </motion.div>
          </section>
        )}

        {result && !result.bestSingleShop && (
          <p className="rounded-card bg-white p-6 text-center text-sm text-ink-muted shadow-tile">
            No shops found within {formatDistance(radiusMeters)}. Try a wider radius.
          </p>
        )}
      </div>
    </div>
  )
}
