import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { AddToCartControl } from '@/components/AddToCartControl'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { RatingDisplay } from '@/components/ui/StarRating'
import { formatDistance, formatRupees } from '@/lib/format'
import { IconTruck } from '@/components/ui/Icon'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const { location, radiusMeters } = useLocation()

  const query = useQuery({
    queryKey: ['product', id, location?.lat, location?.lng, radiusMeters],
    queryFn: () => api.getProductDetail({ productId: id, location: { lat: location!.lat, lng: location!.lng }, radiusMeters }),
    enabled: !!location && !!id,
  })

  return (
    <div>
      <PageHeader title="Product" />
      {query.isLoading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data && (
        <div className="pb-8">
          <div className="bg-white p-6">
            <img src={query.data.product.imageUrl ?? undefined} alt="" className="mx-auto h-40 w-40 rounded-2xl bg-brand-50 object-contain p-4" />
            <div className="mt-4">
              {query.data.product.brand && <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{query.data.product.brand}</p>}
              <h1 className="font-display text-lg font-bold text-ink">{query.data.product.name}</h1>
              <p className="text-sm text-ink/50">{query.data.product.defaultUnitLabel}</p>
              {query.data.product.mrp && <p className="mt-1 text-xs text-ink/40">MRP {formatRupees(query.data.product.mrp)}</p>}
            </div>
          </div>

          <div className="px-4 pt-4">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
              {query.data.offers.length} shop{query.data.offers.length === 1 ? '' : 's'} nearby carry this
            </h2>
            {query.data.offers.length === 0 && (
              <p className="rounded-card bg-white p-5 text-center text-sm text-ink/50 shadow-soft">
                No shops within {formatDistance(radiusMeters)} currently list this item.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {query.data.offers.map((offer) => (
                <div key={offer.shopId} className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-soft">
                  <div className="min-w-0 flex-1">
                    <Link to={`/shop/${offer.shopId}`} className="truncate font-display text-[15px] font-semibold text-ink hover:underline">
                      {offer.shop.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/50">
                      <span className="font-semibold text-brand-700">{formatDistance(offer.shop.distanceMeters)}</span>
                      <RatingDisplay rating={offer.shop.avgRating ?? 0} />
                      {offer.shop.acceptsDelivery && <span className="inline-flex items-center gap-1"><IconTruck size={12} /> Delivery</span>}
                    </div>
                    <AvailabilityBadge availability={offer.availability} availabilityUpdatedAt={offer.availabilityUpdatedAt} className="mt-2" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-display text-base font-bold text-ink">{formatRupees(offer.price)}</span>
                    <AddToCartControl shop={offer.shop} product={query.data.product} offer={offer} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
