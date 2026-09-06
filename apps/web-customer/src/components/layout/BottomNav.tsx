import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Home, Search, ClipboardList, User } from 'lucide-react'
import { useCart } from '@/state/CartContext'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/orders', label: 'Orders', Icon: ClipboardList, badge: 'orders' as const },
  { to: '/account', label: 'Account', Icon: User },
]

/**
 * Mobile tab bar — four destinations, the platform maximum before a tab bar
 * stops being scannable. The active tab is marked by a pill that slides
 * between tabs via a shared layoutId, so the bar reads as one control with a
 * moving selection rather than four buttons lighting up independently.
 *
 * Retired at `lg`, where DesktopHeader carries the same destinations inline.
 */
export function BottomNav() {
  const m = useAppMotion()
  const cart = useCart()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-stretch justify-around',
        'border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur',
        'lg:hidden',
      )}
    >
      {TABS.map(({ to, label, Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          className="relative flex flex-1 flex-col items-center gap-0.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          {({ isActive }) => (
            <>
              <span className="relative flex h-8 w-14 items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    transition={m.reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-pill bg-brand-50"
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={cn('transition-colors', isActive ? 'text-brand-600' : 'text-ink-faint')}
                    aria-hidden
                  />
                  <AnimatePresence>
                    {badge === 'orders' && cart.itemCount > 0 && (
                      <motion.span
                        initial={m.reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-white"
                      />
                    )}
                  </AnimatePresence>
                </span>
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-faint',
                )}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
