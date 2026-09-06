import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Store, RotateCcw } from 'lucide-react'
import type { ShopSummary } from '@shopnear/shared'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { TopBar } from '@/components/layout/TopBar'
import { CategoryGrid } from '@/components/CategoryGrid'
import { PromoCarousel } from '@/components/PromoCarousel'
import { ShopCard } from '@/components/ShopCard'
import { RadiusControl, nextRadiusUp, formatRadius } from '@/components/RadiusControl'
import { ShopTypeControl } from '@/components/ShopTypeControl'
import { Button } from '@/components/ui/Button'
import { ShopListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { listVariants, fadeUp, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * The feed.
 *
 * Chrome (location + search), one editorial hero, the category grid, and then
 * the shop list — because "which shop" is the *last* question a shopper asks,
 * after they know what they want.
 *
 * The merchandised product shelves that used to sit between the hero and the
 * category grid are gone: every one of them was a *global* item list, and
 * items belong to the shop that stocks them (see `getShopCatalogue`). Reorder
 * lives in the header button, not in a rail.
 */

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [typeFilter, setTypeFilter] = useState<ShopSummary['type'] | null>(null)
  const m = useAppMotion()

  const hour = useMemo(() => new Date().getHours(), [])

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories() })

  // Paged: 138 shops sit inside the default 1 km radius, which is not one
  // screen. The service layer does the filtering and the slicing; this only
  // asks for the next page.
  const shopsQuery = useInfiniteQuery({
    queryKey: ['shops-nearby', location?.lat, location?.lng, radiusMeters, typeFilter],
    queryFn: ({ pageParam }) => api.getShopsNearby({
      location: { lat: location!.lat, lng: location!.lng },
      radiusMeters,
      type: typeFilter ?? undefined,
      page: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!location,
  })

  const shops = useMemo(
    () => shopsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [shopsQuery.data],
  )
  /** Total in range, not the number loaded — the heading should say how many
   * shops there are, not how far you have scrolled. */
  const shopCount = shopsQuery.data?.pages[0]?.total ?? 0

  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: () => api.listOrders() })

  /** The order the reorder button opens: the most recent one, whatever its
   * state. No orders means no button — a disabled chip that leads to an empty
   * screen is worse than no chip. */
  const latestOrderId = useMemo(() => {
    const orders = ordersQuery.data ?? []
    if (orders.length === 0) return null
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0].id
  }, [ordersQuery.data])

  const wider = nextRadiusUp(radiusMeters)

  return (
    <div className="lg:pt-6">
      <TopBar />

      {/* Everything above the shop list is browsing — hero and aisles — so it
          shares one tinted surface. The band's edge, not a heading, is what
          tells you the page has changed mode. */}
      <section className="discovery-band pb-7 pt-3 lg:-mx-6 lg:-mt-6 lg:px-6 lg:pb-9 lg:pt-7">

        {/* Greeting is desktop-only — on mobile the coloured TopBar already sets
            context — but the reorder chip is not, so the row itself always
            renders and the chip keeps its place opposite the greeting. */}
        <div
          className={cn(
            'flex items-start justify-between gap-3 px-4 lg:mb-5 lg:px-0',
            latestOrderId && 'mb-3',
          )}
        >
          <div className="hidden min-w-0 lg:block">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              {greetingFor(hour)}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {location
                ? `Showing shops within ${radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} of ${location.label}.`
                : 'Choose a location to see what’s nearby.'}
            </p>
          </div>

          {latestOrderId && (
            <Link
              to={`/orders/${latestOrderId}`}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-tile transition-shadow hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <RotateCcw size={14} aria-hidden />
              Buy it again
            </Link>
          )}
        </div>

        <div>
          <PromoCarousel />
        </div>

        <motion.section
          variants={m.variants(fadeUp)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          className="mt-8"
        >
          <div className="mb-2.5 px-4 lg:px-0">
            <h2 className="font-display text-[17px] font-extrabold tracking-tight text-ink">
              Shop by category
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">Every aisle your neighbourhood carries</p>
          </div>
          {categoriesQuery.data && <CategoryGrid categories={categoriesQuery.data} />}
        </motion.section>
      </section>

      <section className="mt-7 px-4 lg:px-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[17px] font-extrabold tracking-tight text-ink">
              Shops near you
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {shopsQuery.isLoading
                ? 'Finding open shops…'
                : `${shopCount} ${shopCount === 1 ? 'shop' : 'shops'} in range`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShopTypeControl value={typeFilter} onChange={setTypeFilter} />
            <RadiusControl value={radiusMeters} onChange={setRadiusMeters} />
          </div>
        </div>

        {/* The results sit in their own bordered tray. The list, the skeleton
            and the empty state are all the *answer* to the filters directly
            above them, and the frame is what says so — without it an empty
            result read as the page simply stopping. */}
        <div className="rounded-card border border-brand-100 bg-brand-50/40 p-2.5 lg:p-3.5">
          {shopsQuery.isLoading && <ShopListSkeleton />}
          {shopsQuery.isError && <ErrorState onRetry={() => shopsQuery.refetch()} />}
          {shopsQuery.data && shops.length === 0 && (
            <EmptyState
              icon={<Store size={26} aria-hidden />}
              title="No shops in range"
              description="Nothing of this kind within your current radius. Widening the search usually finds several."
              action={
                wider
                  ? { label: `Search ${formatRadius(wider)}`, onClick: () => setRadiusMeters(wider) }
                  : undefined
              }
            />
          )}
          {shops.length > 0 && (
            <>
              <motion.div
                variants={m.variants(listVariants)}
                initial="hidden"
                animate="show"
                className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3"
              >
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </motion.div>

              {shopsQuery.hasNextPage && (
                <div className="mt-3 flex justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => shopsQuery.fetchNextPage()}
                    loading={shopsQuery.isFetchingNextPage}
                  >
                    Show more shops ({shopCount - shops.length} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
