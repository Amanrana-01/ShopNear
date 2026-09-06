import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Search, SlidersHorizontal, CheckCircle2, Bike } from 'lucide-react'
import type { RadiusMeters, SearchSort, ProductSearchGroup, Category } from '@shopnear/shared'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchBox } from '@/components/SearchBox'
import { RadiusControl, nextRadiusUp, formatRadius } from '@/components/RadiusControl'
import { Chip } from '@/components/ui/Chip'
import { ProductCard } from '@/components/ProductCard'
import { CategoryIcon, categoryTint } from '@/components/ui/CategoryIcon'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const SORTS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'distance', label: 'Nearest' },
  { value: 'price_low', label: 'Price ↑' },
  { value: 'price_high', label: 'Price ↓' },
]

/**
 * Results, as a dense product grid rather than a list of expandable cards.
 *
 * The previous layout showed one card per product with a nested list of shop
 * rows inside it, which meant four results filled a screen. A grid of tiles —
 * two columns on a phone, up to five on a wide desktop — is what makes a
 * hundred-item aisle browsable, with per-product shop comparison moved one tap
 * deeper onto the product page where there's room for it.
 */
export default function SearchResults() {
  const [params, setParams] = useSearchParams()
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [sort, setSort] = useState<SearchSort>('relevance')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [deliveryOnly, setDeliveryOnly] = useState(false)
  const m = useAppMotion()

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''

  // A category browse has no relevance signal, so default it to nearest-first.
  useEffect(() => {
    setSort(category && !q ? 'distance' : 'relevance')
  }, [category, q])

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories() })

  const resultsQuery = useQuery({
    queryKey: ['search', location?.lat, location?.lng, radiusMeters, q, category, sort],
    queryFn: () => api.searchProducts({
      location: { lat: location!.lat, lng: location!.lng },
      radiusMeters,
      query: q || undefined,
      categorySlug: category || undefined,
      sort,
    }),
    enabled: !!location && (!!q || !!category),
  })

  const activeCategory = useMemo<Category | undefined>(
    () => categoriesQuery.data?.find((c) => c.slug === category),
    [categoriesQuery.data, category],
  )

  const siblings = useMemo<Category[]>(() => {
    const all = categoriesQuery.data ?? []
    if (!activeCategory) return []
    // Browsing a top level shows its children; browsing a child shows the
    // rest of that aisle, so you can move sideways without going back.
    const parentId = activeCategory.parentId ?? activeCategory.id
    return all.filter((c) => c.parentId === parentId)
  }, [categoriesQuery.data, activeCategory])

  /** Client-side refinements. The API contract has no flags for these, and
   * both are cheap to apply over an already-fetched page of results. */
  const groups = useMemo<ProductSearchGroup[]>(() => {
    let list = resultsQuery.data ?? []
    if (inStockOnly) {
      list = list
        .map((g) => ({ ...g, offers: g.offers.filter((o) => o.availability === 'IN_STOCK') }))
        .filter((g) => g.offers.length > 0)
    }
    if (deliveryOnly) {
      list = list
        .map((g) => ({ ...g, offers: g.offers.filter((o) => o.shop.acceptsDelivery) }))
        .filter((g) => g.offers.length > 0)
    }
    return list
  }, [resultsQuery.data, inStockOnly, deliveryOnly])

  const heading = q
    ? `“${q}”`
    : activeCategory?.name ?? (category ? category.replace(/-/g, ' ') : 'Search')

  const filtersActive = inStockOnly || deliveryOnly
  const wider = nextRadiusUp(radiusMeters)

  return (
    <div>
      <PageHeader
        title={heading.charAt(0).toUpperCase() + heading.slice(1)}
        subtitle={
          resultsQuery.isLoading
            ? 'Checking nearby shops…'
            : groups.length > 0
              ? `${groups.length} ${groups.length === 1 ? 'product' : 'products'} available near you`
              : undefined
        }
      />

      <div className="px-4 pt-3 lg:px-0 lg:pt-0">
        <SearchBox autoFocus={!q && !category} />
      </div>

      {/* Filter bar. Sticks under the header so refinement is always one tap
          away while scrolling a long aisle. */}
      <div className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-20 -mx-0 mt-3 bg-canvas/95 py-2 backdrop-blur lg:top-[4.5rem]">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 lg:px-0">
          <span className="hidden shrink-0 items-center gap-1.5 pr-1 text-xs font-bold text-ink-faint lg:flex">
            <SlidersHorizontal size={14} aria-hidden />
            Filter
          </span>

          {SORTS.map((s) => (
            <Chip
              key={s.value}
              group="sort"
              size="sm"
              active={sort === s.value}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </Chip>
          ))}

          <span className="mx-1 h-5 w-px shrink-0 bg-black/10" aria-hidden />

          <Chip
            group="stock"
            size="sm"
            active={inStockOnly}
            onClick={() => setInStockOnly((v) => !v)}
            icon={<CheckCircle2 size={13} aria-hidden />}
          >
            In stock
          </Chip>
          <Chip
            group="delivery"
            size="sm"
            active={deliveryOnly}
            onClick={() => setDeliveryOnly((v) => !v)}
            icon={<Bike size={13} aria-hidden />}
          >
            Delivers
          </Chip>

          <span className="ml-auto shrink-0 pl-2">
            <RadiusControl value={radiusMeters} onChange={(r: RadiusMeters) => setRadiusMeters(r)} />
          </span>
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {siblings.map((c) => (
            <Link
              key={c.id}
              to={`/search?category=${c.slug}`}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                c.slug === category
                  ? 'border-brand bg-brand text-white'
                  : 'border-black/10 bg-white text-ink-muted hover:border-brand-200',
              )}
            >
              <CategoryIcon iconName={c.iconName} size={14} />
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-6 px-4 pb-8 lg:px-0">
        {/* Desktop aisle navigation. On mobile the same links are the chip row
            above; a sidebar would eat half the viewport. */}
        {siblings.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-[calc(4.5rem+3.5rem)]">
              <h2 className="mb-2 px-2 text-2xs font-black uppercase tracking-wider text-ink-faint">
                In this aisle
              </h2>
              <nav className="flex flex-col gap-0.5">
                {siblings.map((c) => {
                  const active = c.slug === category
                  return (
                    <Link
                      key={c.id}
                      to={`/search?category=${c.slug}`}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        active ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-white hover:text-ink',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          active ? 'bg-brand text-white' : categoryTint(c.slug),
                        )}
                      >
                        <CategoryIcon iconName={c.iconName} size={16} />
                      </span>
                      <span className="min-w-0 truncate">{c.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {!q && !category && (
            <EmptyState
              icon={<Search size={26} aria-hidden />}
              title="Search for anything"
              description="Try “atta”, “Maggi”, or “notebook” — in English, Hindi or Gujarati — to compare prices across every shop in range."
            />
          )}

          {resultsQuery.isLoading && <ProductGridSkeleton count={10} />}
          {resultsQuery.isError && <ErrorState onRetry={() => resultsQuery.refetch()} />}

          {resultsQuery.data && groups.length === 0 && (
            <EmptyState
              icon={<Search size={26} aria-hidden />}
              title={filtersActive ? 'No matches with these filters' : 'Nothing nearby carries that'}
              description={
                filtersActive
                  ? 'Clearing the stock or delivery filter usually brings results back.'
                  : 'Nobody within this radius stocks it yet. A wider search often finds it.'
              }
              action={
                filtersActive
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setInStockOnly(false)
                        setDeliveryOnly(false)
                      },
                    }
                  : wider
                    ? { label: `Search ${formatRadius(wider)}`, onClick: () => setRadiusMeters(wider) }
                    : undefined
              }
            />
          )}

          {groups.length > 0 && (
            <motion.div
              key={`${q}|${category}|${sort}|${inStockOnly}|${deliveryOnly}`}
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {groups.map((group) => (
                <ProductCard
                  key={group.product.id}
                  product={group.product}
                  offer={group.offers[0]}
                  shop={group.offers[0].shop}
                  shopCount={group.offers.length}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
