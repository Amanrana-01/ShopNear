import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { RadiusMeters, SearchSort } from '@shopnear/shared'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { RadiusControl } from '@/components/RadiusControl'
import { Chip } from '@/components/ui/Chip'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { AddToCartControl } from '@/components/AddToCartControl'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { IconSearch, IconChevronDown } from '@/components/ui/Icon'
import { formatDistance, formatRupees } from '@/lib/format'
import { Link } from 'react-router-dom'

const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'distance', label: 'Nearest' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
]

export default function SearchResults() {
  const [params, setParams] = useSearchParams()
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [queryInput, setQueryInput] = useState(params.get('q') ?? '')
  const [sort, setSort] = useState<SearchSort>('relevance')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''

  useEffect(() => setQueryInput(q), [q])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    if (queryInput.trim()) next.set('q', queryInput.trim())
    setParams(next, { replace: true })
  }

  const resultsQuery = useQuery({
    queryKey: ['search', location?.lat, location?.lng, radiusMeters, q, category, sort],
    queryFn: () => api.searchProducts({
      location: { lat: location!.lat, lng: location!.lng }, radiusMeters,
      query: q || undefined, categorySlug: category || undefined, sort,
    }),
    enabled: !!location && (!!q || !!category),
  })

  const title = q ? `“${q}”` : category ? category.replace(/-/g, ' ') : 'Search'

  return (
    <div>
      <PageHeader title={title.charAt(0).toUpperCase() + title.slice(1)} />

      <div className="px-4 pt-3">
        <form onSubmit={submit}>
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            leftIcon={<IconSearch size={18} />}
            placeholder="Search for atta, doodh, Maggi…"
            aria-label="Search products"
            autoFocus={!q && !category}
          />
        </form>

        <div className="mt-3 flex items-center justify-between gap-2">
          <RadiusControl value={radiusMeters} onChange={(r: RadiusMeters) => setRadiusMeters(r)} />
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SearchSort)}
              aria-label="Sort results"
              className="appearance-none rounded-full border border-black/10 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-ink/80 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <IconChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
          </div>
        </div>
      </div>

      <div className="mt-4 px-4 pb-6">
        {!q && !category && (
          <EmptyState icon={<IconSearch size={26} />} title="Search for anything" description="Try 'atta', 'Maggi', or 'notebook' to compare prices across nearby shops." />
        )}
        {resultsQuery.isLoading && <ProductGridSkeleton count={4} />}
        {resultsQuery.isError && <ErrorState onRetry={() => resultsQuery.refetch()} />}
        {resultsQuery.data && resultsQuery.data.length === 0 && (
          <EmptyState
            icon={<IconSearch size={26} />}
            title="No matches nearby"
            description="Nobody within this radius carries that item yet. Try widening the search radius."
            action={{ label: 'Search 3 km', onClick: () => setRadiusMeters(3000) }}
          />
        )}
        <div className="flex flex-col gap-4">
          {resultsQuery.data?.map((group) => {
            const isOpen = expanded.has(group.product.id)
            const shown = isOpen ? group.offers : group.offers.slice(0, 3)
            const cheapest = Math.min(...group.offers.map((o) => o.price))
            return (
              <div key={group.product.id} className="animate-fade-in-up rounded-card bg-white p-3 shadow-soft">
                <Link to={`/product/${group.product.id}`} className="flex gap-3 focus-visible:outline-none">
                  <img src={group.product.imageUrl ?? undefined} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-brand-50 object-contain p-1.5" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-ink">{group.product.name}</p>
                    <p className="text-xs text-ink/45">{group.product.defaultUnitLabel}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-700">
                      From {formatRupees(cheapest)} · {group.offers.length} shop{group.offers.length > 1 ? 's' : ''} nearby
                    </p>
                  </div>
                </Link>

                <ul className="mt-3 flex flex-col divide-y divide-black/5 border-t border-black/5">
                  {shown.map((offer) => (
                    <li key={offer.shopId} className="flex items-center gap-3 py-2.5">
                      <Link to={`/shop/${offer.shopId}`} className="min-w-0 flex-1 focus-visible:outline-none">
                        <p className="truncate text-sm font-medium text-ink">{offer.shop.name}</p>
                        <p className="text-xs text-ink/45">{formatDistance(offer.shop.distanceMeters)} away</p>
                        <AvailabilityBadge availability={offer.availability} availabilityUpdatedAt={offer.availabilityUpdatedAt} size="compact" className="mt-1" />
                      </Link>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-bold text-ink">{formatRupees(offer.price)}</span>
                        <AddToCartControl shop={offer.shop} product={group.product} offer={offer} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
                {group.offers.length > 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev)
                        next.has(group.product.id) ? next.delete(group.product.id) : next.add(group.product.id)
                        return next
                      })
                    }
                    className="mt-1 w-full rounded-full py-1.5 text-center text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    {isOpen ? 'Show less' : `See all ${group.offers.length} shops`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
