import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { TopBar } from '@/components/layout/TopBar'
import { CategoryStrip } from '@/components/CategoryStrip'
import { ShopCard } from '@/components/ShopCard'
import { RadiusControl } from '@/components/RadiusControl'
import { ShopListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { IconStore, IconArrowRight } from '@/components/ui/Icon'
import { Chip } from '@/components/ui/Chip'
import { useState } from 'react'
import type { ShopSummary } from '@shopnear/shared'

const TYPE_CHIPS: { value: ShopSummary['type'] | null; label: string }[] = [
  { value: null, label: 'All shops' },
  { value: 'KIRANA', label: 'Kirana' },
  { value: 'GENERAL', label: 'General' },
  { value: 'CHEMIST', label: 'Chemist' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'STATIONERY', label: 'Stationery' },
  { value: 'HARDWARE', label: 'Hardware' },
]

export default function Home() {
  const { location, radiusMeters, setRadiusMeters } = useLocation()
  const [typeFilter, setTypeFilter] = useState<ShopSummary['type'] | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories() })
  const shopsQuery = useQuery({
    queryKey: ['shops-nearby', location?.lat, location?.lng, radiusMeters, typeFilter],
    queryFn: () => api.getShopsNearby({
      location: { lat: location!.lat, lng: location!.lng }, radiusMeters, type: typeFilter ?? undefined,
    }),
    enabled: !!location,
  })

  return (
    <div>
      <TopBar />

      <section className="px-1 pt-3">
        {categoriesQuery.data && <CategoryStrip categories={categoriesQuery.data} />}
      </section>

      <Link
        to="/multi-search"
        className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3.5 text-white shadow-soft transition-transform active:scale-[0.98]"
      >
        <span>
          <span className="block text-sm font-bold">Got a shopping list?</span>
          <span className="block text-xs text-white/75">"atta, doodh, Maggi, sabun" — we'll find the one shop that has it all</span>
        </span>
        <IconArrowRight size={20} className="shrink-0" />
      </Link>

      <section className="mt-5 px-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-ink">Shops near you</h2>
          <RadiusControl value={radiusMeters} onChange={setRadiusMeters} />
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPE_CHIPS.map((c) => (
            <Chip key={c.label} active={typeFilter === c.value} onClick={() => setTypeFilter(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>

        {shopsQuery.isLoading && <ShopListSkeleton />}
        {shopsQuery.isError && <ErrorState onRetry={() => shopsQuery.refetch()} />}
        {shopsQuery.data && shopsQuery.data.length === 0 && (
          <EmptyState
            icon={<IconStore size={28} />}
            title="No shops in range yet"
            description="Try widening your search radius, or check another category."
            action={{ label: 'Search 3 km', onClick: () => setRadiusMeters(3000) }}
          />
        )}
        {shopsQuery.data && shopsQuery.data.length > 0 && (
          <div className="flex flex-col gap-3">
            {shopsQuery.data.map((shop, i) => (
              <ShopCard key={shop.id} shop={shop} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
