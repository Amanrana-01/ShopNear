import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Star, Bike, Timer, Footprints } from 'lucide-react'
import type { ShopSummary } from '@shopnear/shared'
import { formatDistance, formatRupees } from '@/lib/format'
import { shopMeta, walkMinutes, deliveryMinutes, formatMinutes } from '@/lib/shopMeta'
import { shopPhoto } from '@/lib/photos'
import { itemVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * A shop, as a card.
 *
 * The hierarchy answers the three questions a hyperlocal shopper actually
 * asks, in order: can I get it *now* (open/closed, ETA), is it *close*
 * (distance, walk time), and is it any *good* (rating). Delivery terms come
 * last because most of this catalogue is walk-and-collect.
 */
export function ShopCard({ shop, className }: { shop: ShopSummary; className?: string }) {
  const m = useAppMotion()
  const [photoFailed, setPhotoFailed] = useState(false)
  const { label, Icon, tile } = shopMeta(shop.type)
  const photo = shopPhoto(shop.type, shop.id, { w: 64 })
  const walk = walkMinutes(shop.distanceMeters)
  const ride = deliveryMinutes(shop.distanceMeters)

  return (
    <motion.div variants={m.variants(itemVariants)} whileHover={m.hover} transition={m.transition}>
      <Link
        to={`/shop/${shop.id}`}
        className={cn(
          'flex h-full items-start gap-3 rounded-card bg-white p-3 shadow-tile',
          'transition-shadow duration-200 hover:shadow-pop',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          !shop.isOpenNow && 'opacity-[0.72]',
          className,
        )}
      >
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#F0F4FB]">
          {photo && !photoFailed ? (
            <img
              src={photo}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={cn('flex h-full w-full items-center justify-center', tile)}>
              <Icon size={24} strokeWidth={1.7} aria-hidden />
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-[15px] font-bold leading-tight text-ink">
              {shop.name}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
                shop.isOpenNow ? 'bg-success-50 text-success-700' : 'bg-canvas-sunken text-ink-faint',
              )}
            >
              {shop.isOpenNow ? 'Open' : 'Closed'}
            </span>
          </div>

          <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">
            {[label, shop.address].filter(Boolean).join(' · ')}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
            <span className="inline-flex items-center gap-1 font-bold text-ink">
              <Timer size={12} strokeWidth={2.5} className="text-success-600" aria-hidden />
              {formatMinutes(shop.acceptsDelivery ? ride : walk)}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Footprints size={12} aria-hidden />
              {formatDistance(shop.distanceMeters)}
            </span>
            {typeof shop.avgRating === 'number' && shop.avgRating > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-ink-muted">
                <Star size={12} className="fill-amber-500 text-amber-500" aria-hidden />
                {shop.avgRating.toFixed(1)}
                <span className="font-normal text-ink-faint">({shop.ratingCount})</span>
              </span>
            )}
          </div>

          {shop.acceptsDelivery ? (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
              <Bike size={11} aria-hidden />
              Delivers · {shop.deliveryFee ? `${formatRupees(shop.deliveryFee)} fee` : 'Free'}
              {shop.minOrderValue ? ` over ${formatRupees(shop.minOrderValue)}` : ''}
            </p>
          ) : (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-canvas-sunken px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
              <Footprints size={11} aria-hidden />
              Reserve &amp; collect only
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
