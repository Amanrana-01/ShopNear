import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconHome, IconBell, IconPackage, IconClipboard, IconStore } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import { useIncomingCount } from '@/state/IncomingCountContext'

export function BottomNav() {
  const { t } = useTranslation()
  const incomingCount = useIncomingCount()

  const TABS = [
    { to: '/dashboard', label: t('nav.dashboard'), Icon: IconHome },
    { to: '/orders/incoming', label: t('nav.incoming'), Icon: IconBell, badge: incomingCount },
    { to: '/inventory', label: t('nav.inventory'), Icon: IconPackage },
    { to: '/orders', label: t('nav.history'), Icon: IconClipboard },
    { to: '/shop/profile', label: t('nav.profile'), Icon: IconStore },
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-stretch justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur"
    >
      {TABS.map(({ to, label, Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset',
              isActive ? 'text-brand-600' : 'text-ink/45 hover:text-ink/70',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {!!badge && badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
