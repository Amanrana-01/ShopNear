import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Timer, Store } from 'lucide-react'
import type { Product, Offer, ShopSummary } from '@shopnear/shared'
import { formatRupees } from '@/lib/format'
import { deliveryMinutes, formatMinutes } from '@/lib/shopMeta'
import { itemVariants, useAppMotion } from '@/lib/motion'
import { ProductImage } from './ui/ProductImage'
import { AvailabilityBadge } from './AvailabilityBadge'
import { AddToCartControl } from './AddToCartControl'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  offer: Offer
  shop: ShopSummary
  /** How many nearby shops carry this — shown as a "compare" affordance. */
  shopCount?: number
  className?: string
}

/**
 * The workhorse of the app: the dense grid tile.
 *
 * Reading order is deliberate and matches how people scan a shelf — picture,
 * delivery time, name, size, price, then the ADD control. The tile is a fixed
 * vertical rhythm (square image, two-line name clamp, single meta line) so a
 * grid of them lines up on every row regardless of how long the product names
 * are, and the ADD control keeps its own footprint so tapping it never
 * reflows the row.
 */
export function ProductCard({ product, offer, shop, shopCount, className }: ProductCardProps) {
  const m = useAppMotion()
  const discount =
    product.mrp && product.mrp > offer.price
      ? Math.round(((product.mrp - offer.price) / product.mrp) * 100)
      : 0
  const eta = deliveryMinutes(shop.distanceMeters)

  return (
    <motion.article
      variants={m.variants(itemVariants)}
      whileHover={m.hover}
      transition={m.transition}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-tile bg-white shadow-tile',
        'transition-shadow duration-200 hover:shadow-pop',
        className,
      )}
    >
      <Link
        to={`/product/${product.id}`}
        className="flex flex-1 flex-col rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <ProductImage product={product} size="md" />

          {discount > 0 && (
            <span className="absolute left-0 top-2 rounded-r-md bg-accent px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
              {discount}% off
            </span>
          )}

          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-ink backdrop-blur-sm">
            <Timer size={10} strokeWidth={2.5} aria-hidden />
            {formatMinutes(eta)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2.5 pb-1.5 pt-2">
          <p className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-semibold leading-tight text-ink">
            {product.name}
          </p>
          <p className="text-[11px] text-ink-faint">{product.defaultUnitLabel}</p>
          <AvailabilityBadge
            availability={offer.availability}
            availabilityUpdatedAt={offer.availabilityUpdatedAt}
            size="compact"
            className="mt-0.5 self-start"
          />
        </div>
      </Link>

      <div className="flex items-end justify-between gap-1.5 px-2.5 pb-2.5 pt-1">
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-black text-ink">{formatRupees(offer.price)}</p>
          {discount > 0 && (
            <p className="text-[11px] text-ink-faint line-through">{formatRupees(product.mrp!)}</p>
          )}
        </div>
        <AddToCartControl shop={shop} product={product} offer={offer} size="sm" />
      </div>

      {typeof shopCount === 'number' && shopCount > 1 && (
        <Link
          to={`/product/${product.id}`}
          className="flex items-center justify-center gap-1 border-t border-black/5 py-1.5 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          <Store size={11} aria-hidden />
          Compare {shopCount} shops
        </Link>
      )}
    </motion.article>
  )
}
