import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShop } from '@/state/ShopContext'
import { Sheet } from './ui/Sheet'
import { ShopStatusBadge } from './StatusBadge'
import { IconChevronDown, IconStore } from './ui/Icon'
import { cn } from '@/lib/utils'

/** Header shop switcher — a merchant may own more than one shop (spec: two
 * seeded merchants do), so the active shop is always shown explicitly and
 * switching never assumes shops.length === 1. Single-shop merchants see a
 * plain label with no picker affordance. */
export function ShopSwitcher() {
  const { t } = useTranslation()
  const { shops, activeShop, setActiveShopId } = useShop()
  const [open, setOpen] = useState(false)

  if (!activeShop) return null

  if (shops.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-white">
        <IconStore size={18} />
        <span className="max-w-[160px] truncate text-[15px] font-bold">{activeShop.name}</span>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg py-0.5 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <IconStore size={18} />
        <span className="max-w-[160px] truncate text-[15px] font-bold">{activeShop.name}</span>
        <IconChevronDown size={16} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('shopSwitcher.switchTo')}>
        <div className="flex flex-col gap-2">
          {shops.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => { setActiveShopId(shop.id); setOpen(false) }}
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-colors',
                shop.id === activeShop.id ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white hover:bg-brand-50',
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-ink">{shop.name}</p>
                <p className="truncate text-xs text-ink/55">{shop.address}</p>
              </div>
              <ShopStatusBadge status={shop.status} />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
