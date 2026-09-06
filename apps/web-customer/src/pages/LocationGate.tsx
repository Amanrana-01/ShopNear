import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { MapPin, Loader2, Navigation, Timer, PackageCheck, Store, ChevronRight } from 'lucide-react'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { LogoMark } from '@/components/ui/Logo'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'

const PROMISES = [
  { Icon: PackageCheck, title: 'Real stock, not guesses', body: 'Every item shows when the shop last confirmed it.' },
  { Icon: Timer, title: 'Ready in minutes', body: 'Reserve at the counter and walk over, or have it delivered.' },
  { Icon: Store, title: 'Your own street', body: 'Kirana, chemist, dairy, bakery — everything within your radius.' },
]

/**
 * The very first screen. No shop list, no search — just "where are you?",
 * because everything ShopNear shows depends on distance.
 *
 * On a phone it's a single column; on a desktop it becomes a split landing,
 * with the product's promise on one side and the location picker on the other,
 * so a wide viewport doesn't just stretch a mobile form.
 */
export default function LocationGate() {
  const navigate = useNavigate()
  const { location, setLocation } = useLocation()
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'denied'>('idle')
  const m = useAppMotion()

  // A returning visitor who already picked a location shouldn't see the gate
  // again — send them straight to the feed.
  useEffect(() => {
    if (location) navigate('/home', { replace: true })
  }, [location, navigate])

  const { data: presets, isLoading } = useQuery({
    queryKey: ['location-presets'],
    queryFn: () => api.getLocationPresets(),
  })

  function choose(p: { label: string; sublabel: string; lat: number; lng: number }) {
    setLocation({ label: p.label, sublabel: p.sublabel, lat: p.lat, lng: p.lng })
    navigate('/home')
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoState('denied')
      return
    }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          label: 'Current location',
          sublabel: 'Using your device location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        navigate('/home')
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    )
  }

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-2">
      {/* Brand panel. Full-bleed colour on desktop, a compact header on mobile. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 px-6 pb-10 pt-[calc(3rem+env(safe-area-inset-top))] text-white lg:flex lg:flex-col lg:justify-center lg:px-14 lg:pb-14 lg:pt-14">
        <Store
          size={420}
          strokeWidth={0.6}
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 text-white/[0.07]"
        />

        <div className="relative mx-auto w-full max-w-md lg:mx-0">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <LogoMark size={34} tone="onDark" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight lg:text-[2.75rem]">
            Everything on your street,
            <br />
            <span className="text-white/70">in stock right now.</span>
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
            ShopNear shows what the kirana, chemist and dairy around the corner actually have — with real
            prices and how recently stock was confirmed.
          </p>

          <motion.ul
            variants={m.variants(listVariants)}
            initial="hidden"
            animate="show"
            className="mt-7 flex flex-col gap-3.5"
          >
            {PROMISES.map(({ Icon, title, body }) => (
              <motion.li key={title} variants={m.variants(itemVariants)} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={16} aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-[13px] leading-snug text-white/65">{body}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* Picker */}
      <section className="flex flex-col px-6 pb-10 pt-8 lg:justify-center lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
            Where are you shopping?
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Distance decides everything here, so we need a starting point.
          </p>

          <motion.button
            type="button"
            onClick={useMyLocation}
            disabled={geoState === 'loading'}
            whileTap={m.tap}
            transition={m.transition}
            className="mt-5 flex w-full items-center gap-3 rounded-card bg-brand px-4 py-4 text-left text-white shadow-pop transition-colors hover:bg-brand-600 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              {geoState === 'loading'
                ? <Loader2 size={19} className="animate-spin" aria-hidden />
                : <Navigation size={19} aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Use my current location</span>
              <span className="block text-xs text-white/75">
                {geoState === 'denied'
                  ? 'Couldn’t access it — pick a demo location below'
                  : 'Fastest way to see what’s nearby'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 opacity-70" aria-hidden />
          </motion.button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-2xs font-black uppercase tracking-wider text-ink-faint">
              Or pick a demo location
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[4.5rem] w-full rounded-card" />)}
            </div>
          ) : (
            <motion.div
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2.5"
            >
              {presets?.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  variants={m.variants(itemVariants)}
                  onClick={() => choose(p)}
                  whileHover={m.hover}
                  className="flex items-center gap-3 rounded-card border border-black/5 bg-white p-4 text-left shadow-tile transition-colors hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <MapPin size={18} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{p.label}</span>
                    <span className="block truncate text-xs text-ink-muted">{p.sublabel}</span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-ink-faint" aria-hidden />
                </motion.button>
              ))}
            </motion.div>
          )}

          <Button variant="ghost" size="sm" className="mx-auto mt-6" onClick={() => navigate('/login')}>
            Already have an account? Log in
          </Button>
        </div>
      </section>
    </div>
  )
}
