import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Star, Bike, Footprints, Timer, TrendingDown } from 'lucide-react'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { AddToCartControl } from '@/components/AddToCartControl'
import { ProductImage } from '@/components/ui/ProductImage'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDistance, formatRupees } from '@/lib/format'
import { shopMeta, walkMinutes, deliveryMinutes, formatMinutes } from '@/lib/shopMeta'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * One product, every shop that has it.
 *
 * This is where the product's actual promise lives — the same item priced
 * across every kirana in range, each with how recently that shop confirmed
 * stock. The cheapest offer is called out explicitly rather than left for the
 * reader to find, and offers stay sorted by distance because "nearest" beats
 * "₹3 cheaper" for most of this catalogue.
 */
export default function ProductDetail() {
  const { id = '' } = useParams()
  const { location, radiusMeters } = useLocation()
  const m = useAppMotion()

  const query = useQuery({
    queryKey: ['product', id, location?.lat, location?.lng, radiusMeters],
    queryFn: () => api.getProductDetail({
      productId: id,
      location: { lat: location!.lat, lng: location!.lng },
      radiusMeters,
    }),
    enabled: !!location && !!id,
  })

  const product = query.data?.product
  const offers = query.data?.offers ?? []
  const cheapest = offers.length > 0 ? Math.min(...offers.map((o) => o.price)) : 0
  const dearest = offers.length > 0 ? Math.max(...offers.map((o) => o.price)) : 0
  const spread = dearest - cheapest
  const discount =
    product?.mrp && product.mrp > cheapest
      ? Math.round(((product.mrp - cheapest) / product.mrp) * 100)
      : 0

  return (
    <div className="pb-10">
      <PageHeader title={product?.name ?? 'Product'} subtitle={product?.brand ?? undefined} />

      {query.isLoading && (
        <div className="flex flex-col gap-4 p-4 lg:px-0">
          <Skeleton className="aspect-square w-full max-w-xs rounded-card" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}

      {product && (
        <div className="lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-8">
          <motion.section
            initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white px-4 py-5 shadow-tile lg:sticky lg:top-[5.5rem] lg:rounded-card lg:px-5"
          >
            <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-2xl lg:w-full">
              <ProductImage product={product} size="lg" />
              {discount > 0 && (
                <span className="absolute left-0 top-3 rounded-r-md bg-accent px-2 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  {discount}% off MRP
                </span>
              )}
            </div>

            <div className="mt-4">
              {product.brand && (
                <p className="text-[11px] font-black uppercase tracking-wider text-brand-600">
                  {product.brand}
                </p>
              )}
              <h1 className="mt-0.5 font-display text-xl font-extrabold leading-tight tracking-tight text-ink">
                {product.name}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">{product.defaultUnitLabel}</p>

              {offers.length > 0 && (
                <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-black text-ink">{formatRupees(cheapest)}</span>
                  {product.mrp && product.mrp > cheapest && (
                    <span className="text-sm text-ink-faint line-through">
                      {formatRupees(product.mrp)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-ink-muted">best price nearby</span>
                </div>
              )}

              {spread > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-2.5 py-1.5 text-xs font-semibold text-success-700">
                  <TrendingDown size={13} aria-hidden />
                  Save up to {formatRupees(spread)} by choosing the right shop
                </p>
              )}
            </div>
          </motion.section>

          <section className="px-4 pt-5 lg:px-0 lg:pt-0">
            <h2 className="mb-3 font-display text-[15px] font-extrabold tracking-tight text-ink">
              {offers.length === 0
                ? 'No shops nearby carry this'
                : `${offers.length} ${offers.length === 1 ? 'shop' : 'shops'} nearby carry this`}
            </h2>

            {offers.length === 0 && (
              <EmptyState
                icon={<Footprints size={24} aria-hidden />}
                title="Out of range"
                description={`Nobody within ${formatDistance(radiusMeters)} lists this item right now. Widening your radius on the search screen usually finds it.`}
              />
            )}

            <motion.ul
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2.5"
            >
              {offers.map((offer) => {
                const meta = shopMeta(offer.shop.type)
                const isBest = offer.price === cheapest && offers.length > 1
                return (
                  <motion.li
                    key={offer.shopId}
                    variants={m.variants(itemVariants)}
                    className={cn(
                      'relative flex items-start gap-3 rounded-card bg-white p-3.5 shadow-tile',
                      isBest && 'ring-1 ring-success-600',
                    )}
                  >
                    {isBest && (
                      <span className="absolute -top-2 left-3 rounded-md bg-success-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Best price
                      </span>
                    )}

                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        meta.tile,
                      )}
                    >
                      <meta.Icon size={20} strokeWidth={1.7} aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/shop/${offer.shopId}`}
                        className="truncate font-display text-[15px] font-bold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {offer.shop.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-muted">
                        <span className="inline-flex items-center gap-1 font-bold text-ink">
                          <Timer size={11} strokeWidth={2.5} className="text-success-600" aria-hidden />
                          {formatMinutes(
                            offer.shop.acceptsDelivery
                              ? deliveryMinutes(offer.shop.distanceMeters)
                              : walkMinutes(offer.shop.distanceMeters),
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Footprints size={11} aria-hidden />
                          {formatDistance(offer.shop.distanceMeters)}
                        </span>
                        {typeof offer.shop.avgRating === 'number' && (
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Star size={11} className="fill-amber-500 text-amber-500" aria-hidden />
                            {offer.shop.avgRating.toFixed(1)}
                          </span>
                        )}
                        {offer.shop.acceptsDelivery && (
                          <span className="inline-flex items-center gap-1">
                            <Bike size={11} aria-hidden />
                            Delivers
                          </span>
                        )}
                      </div>
                      <AvailabilityBadge
                        availability={offer.availability}
                        availabilityUpdatedAt={offer.availabilityUpdatedAt}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={cn(
                          'font-display text-base font-black',
                          isBest ? 'text-success-700' : 'text-ink',
                        )}
                      >
                        {formatRupees(offer.price)}
                      </span>
                      <AddToCartControl shop={offer.shop} product={product} offer={offer} />
                    </div>
                  </motion.li>
                )
              })}
            </motion.ul>
          </section>
        </div>
      )}
    </div>
  )
}
