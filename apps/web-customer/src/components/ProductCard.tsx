import type { Product, Offer, ShopSummary } from '@shopnear/shared'
import { Link } from 'react-router-dom'
import { formatRupees } from '@/lib/format'
import { AvailabilityBadge } from './AvailabilityBadge'
import { AddToCartControl } from './AddToCartControl'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  offer: Offer
  shop: ShopSummary
  className?: string
  style?: React.CSSProperties
}

/** The dense 2-column grid card — image, 2-line name, unit, price (MRP
 * struck through when it differs), confidence badge, and the ADD control in
 * the corner. This is the workhorse component of the whole app. */
export function ProductCard({ product, offer, shop, className, style }: ProductCardProps) {
  const showStrike = product.mrp && product.mrp > offer.price
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft transition-shadow hover:shadow-pop animate-fade-in-up',
        className,
      )}
      style={style}
    >
      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset rounded-card">
        <div className="relative aspect-square w-full bg-brand-50/60 p-3">
          <img src={product.imageUrl ?? undefined} alt="" className="h-full w-full object-contain" loading="lazy" />
          {showStrike && (
            <span className="absolute left-2 top-2 rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {Math.round(((product.mrp! - offer.price) / product.mrp!) * 100)}% OFF
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-2.5 pb-2 pt-1.5">
          <p className="line-clamp-2 min-h-[2.2em] text-[13px] font-medium leading-tight text-ink">{product.name}</p>
          <p className="text-[11px] text-ink/45">{product.defaultUnitLabel}</p>
          <AvailabilityBadge availability={offer.availability} availabilityUpdatedAt={offer.availabilityUpdatedAt} size="compact" className="mt-0.5 self-start" />
        </div>
      </Link>
      <div className="flex items-end justify-between gap-1 px-2.5 pb-2.5">
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-bold text-ink">{formatRupees(offer.price)}</p>
          {showStrike && <p className="text-[11px] text-ink/35 line-through">{formatRupees(product.mrp!)}</p>}
        </div>
        <AddToCartControl shop={shop} product={product} offer={offer} size="sm" />
      </div>
    </div>
  )
}
