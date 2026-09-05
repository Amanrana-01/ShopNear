import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { useCart } from '@/state/CartContext'
import { formatRupees } from '@/lib/format'
import { pluralize } from '@/lib/format'
import { IconBag, IconChevronRight } from '@/components/ui/Icon'

/** Slides up the moment the cart is non-empty — the floating action bar
 * every quick-commerce app leads with. Sits just above the bottom tab bar.
 * Hidden on cart/checkout themselves, which carry their own equivalent CTA. */
export function CartBar() {
  const cart = useCart()
  const navigate = useNavigate()
  const { pathname } = useRouterLocation()
  if (cart.itemCount === 0) return null
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 animate-slide-up">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-ink px-5 py-3.5 text-white shadow-pop transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <IconBag size={16} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold">
              {cart.itemCount}
            </span>
          </span>
          <span className="text-left text-sm">
            <span className="block font-semibold">{formatRupees(cart.subtotal)}</span>
            <span className="block text-[11px] text-white/70">
              {cart.itemCount} {pluralize(cart.itemCount, 'item')} from {cart.shop?.name}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-0.5 text-sm font-bold">
          View cart <IconChevronRight size={16} />
        </span>
      </button>
    </div>
  )
}
