import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Search, Clock, Bike, Star, Footprints, Timer, PackageCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { formatDistance, formatRupees } from '@/lib/format'
import { shopMeta, walkMinutes, deliveryMinutes, formatMinutes } from '@/lib/shopMeta'
import { shopPhoto } from '@/lib/photos'
import { listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** Turns a leaf slug into a chip label without needing the category fixture —
 * the real API returns no slug at all, so this path has to degrade gracefully. */
function labelForSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ShopPage() {
  const { id = '' } = useParams()
  const { location } = useLocation()
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const m = useAppMotion()

  // The real GET /api/shops/:id has no location anchor, so distance is
  // computed client-side from wherever the customer currently is.
  const shopQuery = useQuery({
    queryKey: ['shop', id, location?.lat, location?.lng],
    queryFn: () => api.getShop(id, { lat: location!.lat, lng: location!.lng }),
    enabled: !!id && !!location,
  })

  // Typing shouldn't fire a request per keystroke now that the filter runs in
  // the service layer rather than over an already-loaded array.
  const [debouncedQ, setDebouncedQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  // Filtering, sorting and paging all happen behind `getShopCatalogue` — a
  // kirana's catalogue runs past 300 lines, so the page never holds more than
  // it is showing.
  const inventoryQuery = useInfiniteQuery({
    queryKey: ['shop-inventory', id, categorySlug, debouncedQ],
    queryFn: ({ pageParam }) => api.getShopCatalogue({
      shopId: id,
      categorySlug: categorySlug ?? undefined,
      query: debouncedQ || undefined,
      page: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!id,
  })

  const entries = useMemo(
    () => inventoryQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [inventoryQuery.data],
  )
  const matchCount = inventoryQuery.data?.pages[0]?.total ?? 0

  const shop = shopQuery.data

  // Chip counts come from the shop's inventory summary, not from the loaded
  // rows — those are one page of a filtered list, so counting them would make
  // every chip read "20". The real API returns no category slugs at all (no
  // Category join), so it supplies no facet and the chips simply don't appear.
  const categories = useMemo(() => {
    const byCategory = shop?.inventorySummary.byCategory
    if (!byCategory) return []
    return Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  }, [shop])
  const meta = shopMeta(shop?.type)
  const inStockCount = shop?.inventorySummary.byAvailability?.IN_STOCK ?? 0

  return (
    <div>
      <PageHeader title={shop?.name ?? 'Shop'} subtitle={shop ? meta.label : undefined} />

      {shopQuery.isLoading && (
        <div className="p-4 lg:px-0">
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      )}
      {shopQuery.isError && <ErrorState onRetry={() => shopQuery.refetch()} />}

      {shop && (
        <motion.section
          initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden bg-white shadow-tile lg:rounded-card"
        >
          {/* Storefront photography for the shop's trade, darkened at the
              bottom so the overlaid badge and the avatar that overlaps it
              stay legible against whatever the photo contains. */}
          <div className="relative h-28 overflow-hidden bg-brand-700 sm:h-36">
            <img
              src={shopPhoto(shop.type, shop.id, { w: 800, h: 180 }) ?? undefined}
              alt=""
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20"
            />
            <span
              className={cn(
                'absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide',
                shop.isOpenNow ? 'bg-success-600 text-white' : 'bg-white/85 text-ink-muted',
              )}
            >
              {shop.isOpenNow ? 'Open now' : 'Closed'}
            </span>
          </div>

          <div className="px-4 pb-4">
            <div className="relative -mt-9 mb-3 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-white shadow-soft">
              <span className={cn('flex h-16 w-16 items-center justify-center rounded-xl', meta.tile)}>
                <meta.Icon size={28} strokeWidth={1.7} aria-hidden />
              </span>
            </div>

            <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">{shop.name}</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">{shop.address}</p>
            {shop.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{shop.description}</p>
            )}

            <dl className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                Icon={Timer}
                label={shop.acceptsDelivery ? 'Delivery' : 'Walk over'}
                value={formatMinutes(
                  shop.acceptsDelivery
                    ? deliveryMinutes(shop.distanceMeters)
                    : walkMinutes(shop.distanceMeters),
                )}
              />
              <Stat Icon={Footprints} label="Distance" value={formatDistance(shop.distanceMeters)} />
              <Stat
                Icon={Star}
                label={`${shop.ratingCount ?? 0} ratings`}
                value={(shop.avgRating ?? 0).toFixed(1)}
              />
              <Stat
                Icon={PackageCheck}
                label="Confirmed in stock"
                value={`${inStockCount}`}
              />
            </dl>

            {shop.acceptsDelivery && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700">
                <Bike size={13} aria-hidden />
                Delivers for {formatRupees(shop.deliveryFee ?? 0)} on orders over{' '}
                {formatRupees(shop.minOrderValue ?? 0)}
              </p>
            )}

            <details className="group mt-3 rounded-xl bg-canvas p-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                <Clock size={14} aria-hidden />
                Opening hours
                <span className="ml-auto text-xs font-medium text-ink-faint group-open:hidden">Show</span>
                <span className="ml-auto hidden text-xs font-medium text-ink-faint group-open:inline">Hide</span>
              </summary>
              <ul className="mt-2.5 flex flex-col gap-1 text-xs">
                {DAY_KEYS.map((key, i) => {
                  const hours = shop.openingHours[key]
                  return (
                    <li key={key} className="flex justify-between">
                      <span className="text-ink-faint">{DAY_LABELS[i]}</span>
                      <span className="font-semibold text-ink">
                        {hours ? `${hours.open} – ${hours.close}` : 'Closed'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </details>
          </div>
        </motion.section>
      )}

      <div className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-20 bg-canvas/95 px-4 pb-2 pt-3 backdrop-blur lg:top-[4.5rem] lg:px-0">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leftIcon={<Search size={16} aria-hidden />}
          placeholder={`Search inside ${shop?.name ?? 'this shop'}`}
          aria-label="Search this shop's inventory"
        />
        {categories.length > 1 && (
          <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
            <Chip
              group="shop-cat"
              size="sm"
              active={!categorySlug}
              onClick={() => setCategorySlug(null)}
              count={shop?.inventorySummary.totalItems ?? 0}
            >
              All
            </Chip>
            {categories.map(([slug, count]) => (
              <Chip
                key={slug}
                group="shop-cat"
                size="sm"
                active={categorySlug === slug}
                onClick={() => setCategorySlug(slug)}
                count={count}
              >
                {labelForSlug(slug)}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-8 pt-2 lg:px-0">
        {inventoryQuery.isLoading && <ProductGridSkeleton count={10} />}
        {inventoryQuery.isError && <ErrorState onRetry={() => inventoryQuery.refetch()} />}
        {inventoryQuery.data && entries.length === 0 && (
          <EmptyState
            icon={<Search size={24} aria-hidden />}
            title="Nothing found here"
            description="This shop doesn't list anything matching that. Try another term or category."
            action={
              q || categorySlug
                ? {
                    label: 'Clear filters',
                    onClick: () => {
                      setQ('')
                      setCategorySlug(null)
                    },
                  }
                : undefined
            }
          />
        )}
        {entries.length > 0 && shop && (
          <>
            <motion.div
              key={`${categorySlug}|${debouncedQ}`}
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {entries.map((entry) => (
                <ProductCard
                  key={entry.product.id}
                  product={entry.product}
                  offer={entry.offer}
                  shop={shop}
                />
              ))}
            </motion.div>

            {inventoryQuery.hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => inventoryQuery.fetchNextPage()}
                  loading={inventoryQuery.isFetchingNextPage}
                >
                  Show more ({matchCount - entries.length} left)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas px-2.5 py-2">
      <dt className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
        <Icon size={11} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 text-sm font-black text-ink">{value}</dd>
    </div>
  )
}
