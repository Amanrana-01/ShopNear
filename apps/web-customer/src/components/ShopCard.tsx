import { Link } from 'react-router-dom'
import type { ShopSummary } from '@shopnear/shared'
import { formatDistance } from '@/lib/format'
import { RatingDisplay } from '@/components/ui/StarRating'
import { IconTruck, IconStore } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const SHOP_TYPE_LABEL: Record<ShopSummary['type'], string> = {
  KIRANA: 'Kirana', GENERAL: 'General store', STATIONERY: 'Stationery', HARDWARE: 'Hardware',
  CHEMIST: 'Chemist', BAKERY: 'Bakery', DAIRY: 'Dairy', FARSAN: 'Farsan', VEGETABLE: 'Vegetables',
}

export function ShopCard({ shop, style }: { shop: ShopSummary; style?: React.CSSProperties }) {
  return (
    <Link
      to={`/shop/${shop.id}`}
      style={style}
      className="flex items-center gap-3 rounded-card bg-white p-3 shadow-soft transition-shadow hover:shadow-pop animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <IconStore size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[15px] font-semibold text-ink">{shop.name}</h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              shop.isOpenNow ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500',
            )}
          >
            {shop.isOpenNow ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink/50">{SHOP_TYPE_LABEL[shop.type]} · {shop.address}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <span className="font-semibold text-brand-700">{formatDistance(shop.distanceMeters)} away</span>
          <RatingDisplay rating={shop.avgRating} count={shop.ratingCount} />
          {shop.acceptsDelivery && (
            <span className="inline-flex items-center gap-1 text-ink/50">
              <IconTruck size={12} /> Delivery
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
