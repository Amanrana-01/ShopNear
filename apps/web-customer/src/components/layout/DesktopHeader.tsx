import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, MapPin, ShoppingCart, Package, User, Zap } from 'lucide-react'
import { useLocation } from '@/state/LocationContext'
import { useCart } from '@/state/CartContext'
import { LocationSheet } from '@/components/LocationSheet'
import { SearchBox } from '@/components/SearchBox'
import { Logo } from '@/components/ui/Logo'
import { formatRupees } from '@/lib/format'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/orders', label: 'Orders', Icon: Package },
  { to: '/account', label: 'Account', Icon: User },
]

/**
 * Desktop header (lg and up).
 *
 * The mobile app is a single phone-width column; on a wide viewport that reads
 * as an unfinished port, so from `lg` the chrome becomes a real web header —
 * brand, location, a full-width search, and a persistent cart button — and the
 * bottom tab bar is retired in favour of inline links.
 */
export function DesktopHeader() {
  const { location } = useLocation()
  const cart = useCart()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const m = useAppMotion()

  return (
    <header className="sticky top-0 z-30 hidden border-b border-black/5 bg-white/90 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-[4.5rem] max-w-app items-center gap-6 px-6">
        <Link
          to="/home"
          aria-label="ShopNear home"
          className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Logo size={34} />
        </Link>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex shrink-0 max-w-[15rem] items-center gap-2 rounded-xl border border-black/5 bg-canvas px-3 py-2 text-left transition-colors hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <MapPin size={16} className="shrink-0 text-brand-600" aria-hidden />
          <span className="min-w-0">
            <span className="block text-2xs font-semibold uppercase tracking-wide text-ink-faint">
              Deliver to
            </span>
            <span className="block truncate text-[13px] font-bold text-ink">
              {location?.label ?? 'Choose location'}
            </span>
          </span>
          <ChevronDown size={15} className="shrink-0 text-ink-faint" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <SearchBox size="lg" />
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-pill bg-success-50 px-3 py-1.5 text-xs font-bold text-success-700 xl:flex">
          <Zap size={13} className="fill-current" aria-hidden />
          10–20 min
        </span>

        <nav className="flex shrink-0 items-center gap-1" aria-label="Primary">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-brand-50/60 hover:text-ink',
                )
              }
            >
              <Icon size={17} aria-hidden />
              {label}
            </NavLink>
          ))}

          <motion.button
            type="button"
            onClick={() => navigate('/cart')}
            whileTap={m.tap}
            transition={m.transition}
            className="ml-1 flex items-center gap-2.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <span className="relative">
              <ShoppingCart size={18} aria-hidden />
              <AnimatePresence>
                {cart.itemCount > 0 && (
                  <motion.span
                    key="count"
                    initial={m.reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={m.transition}
                    className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black tabular-nums text-white"
                  >
                    {cart.itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {cart.itemCount > 0 ? formatRupees(cart.subtotal) : 'Cart'}
          </motion.button>
        </nav>
      </div>

      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </header>
  )
}
