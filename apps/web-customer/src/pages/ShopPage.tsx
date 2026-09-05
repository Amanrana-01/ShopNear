import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductCard } from '@/components/ProductCard'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { RatingDisplay } from '@/components/ui/StarRating'
import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { IconTruck, IconClock, IconSearch, IconStore } from '@/components/ui/Icon'
import { formatDistance } from '@/lib/format'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export default function ShopPage() {
  const { id = '' } = useParams()
  const { location } = useLocation()
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [q, setQ] = useState('')

  // The real GET /api/shops/:id has no location anchor, so distance is
  // computed client-side from wherever the customer currently is.
  const shopQuery = useQuery({
    queryKey: ['shop', id, location?.lat, location?.lng],
    queryFn: () => api.getShop(id, { lat: location!.lat, lng: location!.lng }),
    enabled: !!id && !!location,
  })
  const inventoryQuery = useQuery({
    queryKey: ['shop-inventory', id, categorySlug, q],
    queryFn: () => api.getShopInventory({ shopId: id, categorySlug: categorySlug ?? undefined, query: q || undefined }),
    enabled: !!id,
  })

  const categories = useMemo(() => {
    if (!inventoryQuery.data) return []
    const set = new Map<string, number>()
    for (const e of inventoryQuery.data) {
      // The real API returns only a raw categoryId, never a slug, so category
      // chips simply don't appear when running against live data.
      const slug = e.product.categorySlug
      if (!slug) continue
      set.set(slug, (set.get(slug) ?? 0) + 1)
    }
    return Array.from(set.entries())
  }, [inventoryQuery.data])

  const shop = shopQuery.data

  return (
    <div>
      <PageHeader title={shop?.name ?? 'Shop'} />

      {shopQuery.isLoading && <div className="p-4"><Skeleton className="h-32 w-full rounded-2xl" /></div>}
      {shopQuery.isError && <ErrorState onRetry={() => shopQuery.refetch()} />}

      {shop && (
        <div className="bg-white px-4 pb-4 pt-3 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <IconStore size={30} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-lg font-bold text-ink">{shop.name}</h1>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${shop.isOpenNow ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                  {shop.isOpenNow ? 'Open now' : 'Closed'}
                </span>
              </div>
              <p className="text-sm text-ink/50">{shop.address}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-semibold text-brand-700">{formatDistance(shop.distanceMeters)} away</span>
                <RatingDisplay rating={shop.avgRating ?? 0} count={shop.ratingCount ?? 0} />
                {shop.acceptsDelivery && (
                  <span className="inline-flex items-center gap-1 text-ink/50">
                    <IconTruck size={12} /> Delivery ₹{shop.deliveryFee}, min ₹{shop.minOrderValue}
                  </span>
                )}
              </div>
            </div>
          </div>
          {shop.description && <p className="mt-3 text-sm text-ink/60">{shop.description}</p>}

          <details className="mt-3 rounded-xl bg-brand-50/60 p-3 text-sm text-ink/70 open:pb-3">
            <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <IconClock size={15} /> Opening hours
            </summary>
            <ul className="mt-2 flex flex-col gap-1 text-xs">
              {DAY_KEYS.map((key, i) => {
                const hours = shop.openingHours[key]
                return (
                  <li key={key} className="flex justify-between">
                    <span className="text-ink/50">{DAY_LABELS[i]}</span>
                    <span className="font-medium text-ink">{hours ? `${hours.open} – ${hours.close}` : 'Closed'}</span>
                  </li>
                )
              })}
            </ul>
          </details>
        </div>
      )}

      <div className="px-4 pt-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} leftIcon={<IconSearch size={16} />} placeholder={`Search inside ${shop?.name ?? 'this shop'}`} aria-label="Search this shop's inventory" />
        {categories.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={!categorySlug} onClick={() => setCategorySlug(null)}>All ({inventoryQuery.data?.length ?? 0})</Chip>
            {categories.map(([slug, count]) => (
              <Chip key={slug} active={categorySlug === slug} onClick={() => setCategorySlug(slug)}>
                {slug.replace(/-/g, ' ')} ({count})
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-8 pt-3">
        {inventoryQuery.isLoading && <ProductGridSkeleton />}
        {inventoryQuery.data && inventoryQuery.data.length === 0 && (
          <EmptyState icon={<IconSearch size={24} />} title="Nothing found" description="Try a different search term or category." />
        )}
        {inventoryQuery.data && inventoryQuery.data.length > 0 && shop && (
          <div className="grid grid-cols-2 gap-3">
            {inventoryQuery.data.map((entry, i) => (
              <ProductCard key={entry.product.id} product={entry.product} offer={entry.offer} shop={shop} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
