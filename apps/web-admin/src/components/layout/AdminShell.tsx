import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { cn } from '@/lib/utils'
import {
  IconStore, IconPackage, IconClipboard, IconFlag, IconBarChart, IconSliders, IconLogOut,
} from '@/components/ui/Icon'

const NAV_ITEMS = [
  { to: '/shops', label: 'Shop approvals', Icon: IconStore },
  { to: '/catalogue', label: 'Master catalogue', Icon: IconPackage },
  { to: '/orders', label: 'Order explorer', Icon: IconClipboard },
  { to: '/disputes', label: 'Disputes', Icon: IconFlag },
  { to: '/analytics', label: 'Analytics', Icon: IconBarChart },
  { to: '/ranking', label: 'Ranking & decay', Icon: IconSliders },
]

/** Desktop-first shell: fixed sidebar + top bar, wide content area with
 * room for multi-column dashboards and data tables (spec: admin is
 * operator-at-a-desk, unlike the mobile-first customer/merchant apps). */
export function AdminShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[#F7F5FB]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-brand-100 bg-white">
        <div className="flex items-center gap-2 border-b border-brand-50 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-display font-bold">S</div>
          <div>
            <p className="font-display text-sm font-bold text-ink">ShopNear</p>
            <p className="text-xs text-ink/50">Operator console</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink/65 hover:bg-brand-50/60 hover:text-ink',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-50 px-4 py-4">
          <p className="truncate text-xs font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-xs text-ink/50">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink/60 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <IconLogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  )
}
