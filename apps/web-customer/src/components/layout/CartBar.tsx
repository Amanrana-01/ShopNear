import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '@/state/CartContext'
import { formatRupees, pluralize } from '@/lib/format'
import { useAppMotion } from '@/lib/motion'

/**
 * The floating cart bar every quick-commerce app leads with — slides up the
 * moment the cart is non-empty, sits just above the tab bar, and is the only
 * route to checkout on mobile.
 *
 * Hidden on cart/checkout (they carry their own CTA) and from `lg` up, where
 * the desktop header holds a persistent cart button instead.
 */
export function CartBar() {
  const cart = useCart()
  const navigate = useNavigate()
  const { pathname } = useRouterLocation()
  const m = useAppMotion()

  const hidden =
    cart.itemCount === 0 || pathname.startsWith('/cart') || pathname.startsWith('/checkout')

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={m.reduced ? { opacity: 0 } : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={m.reduced ? { opacity: 0 } : { y: 90, opacity: 0 }}
          transition={m.reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:hidden"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/cart')}
            whileTap={m.tap}
            className="flex w-full max-w-md items-center justify-between gap-3 rounded-pill bg-ink px-4 py-3 text-white shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ShoppingBag size={17} aria-hidden />
                <motion.span
                  key={cart.itemCount}
                  initial={m.reduced ? false : { scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={m.transition}
                  className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black tabular-nums"
                >
                  {cart.itemCount}
                </motion.span>
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-bold leading-tight">{formatRupees(cart.subtotal)}</span>
                <span className="block truncate text-2xs text-white/70">
                  {cart.itemCount} {pluralize(cart.itemCount, 'item')} · {cart.shop?.name}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold">
              View cart
              <ChevronRight size={16} aria-hidden />
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
