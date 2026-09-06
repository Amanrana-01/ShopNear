import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  User, ClipboardList, MapPin, LogOut, ChevronRight, Store, ListChecks, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/state/AuthContext'
import { useLocation } from '@/state/LocationContext'
import { Button } from '@/components/ui/Button'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export default function Account() {
  const { user, isLoading, logout } = useAuth()
  const { location, clearLocation } = useLocation()
  const navigate = useNavigate()
  const m = useAppMotion()

  return (
    <div className="pb-10">
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-brand-500 px-5 pb-7 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white lg:mt-6 lg:rounded-card lg:pt-7">
        <User
          size={200}
          strokeWidth={0.7}
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-8 text-white/[0.08]"
        />
        <div className="relative">
          <h1 className="font-display text-xl font-extrabold tracking-tight lg:text-2xl">Account</h1>

          {!isLoading &&
            (user ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-lg font-black backdrop-blur">
                  {(user.name?.trim()?.[0] ?? 'S').toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{user.name}</p>
                  <p className="text-sm text-white/70">+91 {user.phone}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-white/10 p-4 backdrop-blur">
                <div>
                  <p className="text-sm font-bold">You’re browsing as a guest</p>
                  <p className="text-xs text-white/70">Log in to keep orders across devices</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate('/login')}>
                  Log in
                </Button>
              </div>
            ))}
        </div>
      </header>

      <motion.nav
        variants={m.variants(listVariants)}
        initial="hidden"
        animate="show"
        className="mx-4 mt-4 flex flex-col divide-y divide-black/5 overflow-hidden rounded-card bg-white shadow-tile lg:mx-0"
      >
        <AccountRow to="/orders" Icon={ClipboardList} label="Your orders" hint="Track and reorder" />
        <AccountRow to="/multi-search" Icon={ListChecks} label="Shopping list search" hint="Cover a whole list in one shop" />

        <motion.button
          variants={m.variants(itemVariants)}
          type="button"
          onClick={() => {
            clearLocation()
            navigate('/')
          }}
          className="flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MapPin size={17} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">Change location</span>
            {location && (
              <span className="block truncate text-xs text-ink-muted">{location.label}</span>
            )}
          </span>
          <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden />
        </motion.button>

        {user && (
          <motion.button
            variants={m.variants(itemVariants)}
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <LogOut size={17} aria-hidden />
            </span>
            Log out
          </motion.button>
        )}
      </motion.nav>

      <div className="mx-4 mt-4 grid gap-2.5 sm:grid-cols-2 lg:mx-0">
        <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-tile">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700">
            <Store size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">Are you a shop owner?</p>
            <p className="text-xs text-ink-muted">Register on the ShopNear merchant app</p>
          </div>
          <span className="shrink-0 rounded-md bg-canvas-sunken px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-ink-muted">
            Soon
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-tile">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">You always pay at the shop</p>
            <p className="text-xs text-ink-muted">Reservations never charge your card</p>
          </div>
        </div>
      </div>

      <p className="mt-7 text-center text-xs text-ink-faint">ShopNear · demo build · v1.0</p>
    </div>
  )
}

function AccountRow({
  to, Icon, label, hint,
}: { to: string; Icon: LucideIcon; label: string; hint?: string }) {
  const m = useAppMotion()
  return (
    <motion.div variants={m.variants(itemVariants)}>
      <Link
        to={to}
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={17} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          {hint && <span className="block truncate text-xs text-ink-muted">{hint}</span>}
        </span>
        <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>
    </motion.div>
  )
}
