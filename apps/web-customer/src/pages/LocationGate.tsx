import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLocation } from '@/state/LocationContext'
import { Button } from '@/components/ui/Button'
import { IconMapPin, IconLoader } from '@/components/ui/Icon'
import { ShopListSkeleton } from '@/components/ui/Skeleton'

/** The very first screen. No shop list, no search — just "where are you?",
 * because everything ShopNear shows depends on distance. */
export default function LocationGate() {
  const navigate = useNavigate()
  const { location, setLocation } = useLocation()
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'denied'>('idle')

  // A returning visitor who already picked a location shouldn't see the
  // gate again — send them straight to the feed.
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
        setLocation({ label: 'Current location', sublabel: 'Using your device location', lat: pos.coords.latitude, lng: pos.coords.longitude })
        navigate('/home')
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-gradient-to-b from-brand-50 via-white to-white px-6 pb-10 pt-[calc(3.5rem+env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-3xl font-black text-white shadow-pop">
          SN
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Shops next door, confirmed fast</h1>
        <p className="mt-2 max-w-xs text-sm text-ink/55">
          Find what you need at the kirana, chemist, or stationer nearby — reserve it, walk over, pay in person.
        </p>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoState === 'loading'}
          className="mt-8 flex w-full items-center gap-3 rounded-2xl bg-brand px-5 py-4 text-left text-white shadow-pop transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            {geoState === 'loading' ? <IconLoader size={20} /> : <IconMapPin size={20} />}
          </span>
          <span>
            <span className="block text-sm font-bold">Use my current location</span>
            <span className="block text-xs text-white/75">
              {geoState === 'denied' ? "Couldn't access it — try a demo location below" : 'Fastest way to see what’s nearby'}
            </span>
          </span>
        </button>

        <div className="mt-8 w-full text-left">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">Or pick a demo location</p>
          {isLoading ? (
            <ShopListSkeleton count={2} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {presets?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choose(p)}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-soft transition-colors hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <IconMapPin size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{p.label}</span>
                    <span className="block text-xs text-ink/50">{p.sublabel}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="mx-auto mt-6" onClick={() => navigate('/login')}>
        Already have an account? Log in
      </Button>
    </div>
  )
}
