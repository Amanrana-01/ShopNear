import { NavLink } from 'react-router-dom'
import { IconHome, IconSearch, IconPackage, IconUser } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/home', label: 'Home', Icon: IconHome },
  { to: '/search', label: 'Search', Icon: IconSearch },
  { to: '/orders', label: 'Orders', Icon: IconPackage },
  { to: '/account', label: 'Account', Icon: IconUser },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-stretch justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur"
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset',
              isActive ? 'text-brand-600' : 'text-ink/45 hover:text-ink/70',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
