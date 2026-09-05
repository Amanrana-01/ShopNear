import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { useLocation } from '@/state/LocationContext'
import { Button } from '@/components/ui/Button'
import { IconUser, IconPackage, IconMapPin, IconLogOut, IconChevronRight, IconStore } from '@/components/ui/Icon'

export default function Account() {
  const { user, isLoading, logout } = useAuth()
  const { location, clearLocation } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="pb-8">
      <header className="bg-brand px-5 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white">
        <h1 className="font-display text-xl font-bold">Account</h1>
        {!isLoading && (
          user ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><IconUser size={22} /></div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-white/70">+91 {user.phone}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold">You're browsing as a guest</p>
                <p className="text-sm text-white/70">Log in to track orders across devices</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/login')}>Log in</Button>
            </div>
          )
        )}
      </header>

      <nav className="mx-4 mt-4 flex flex-col divide-y divide-black/5 overflow-hidden rounded-card bg-white shadow-soft">
        <AccountRow to="/orders" icon={<IconPackage size={18} />} label="Your orders" />
        <button
          type="button"
          onClick={() => { clearLocation(); navigate('/') }}
          className="flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-ink hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600"><IconMapPin size={17} /></span>
          <span className="flex-1">
            Change location
            {location && <span className="block text-xs font-normal text-ink/45">{location.label}</span>}
          </span>
          <IconChevronRight size={17} className="text-ink/25" />
        </button>
        {user && (
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50"><IconLogOut size={17} /></span>
            Log out
          </button>
        )}
      </nav>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><IconStore size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Are you a shop owner?</p>
          <p className="text-xs text-ink/50">Register your shop on ShopNear's merchant app</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-brand-600">Coming soon</span>
      </div>

      <p className="mt-6 text-center text-xs text-ink/30">ShopNear · college project demo · v1.0</p>
    </div>
  )
}

function AccountRow({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">{icon}</span>
      <span className="flex-1">{label}</span>
      <IconChevronRight size={17} className="text-ink/25" />
    </Link>
  )
}
