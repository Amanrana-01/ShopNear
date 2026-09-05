import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { IconMapPin, IconLoader } from '@/components/ui/Icon'
import { useLocation } from '@/state/LocationContext'
import { api } from '@/api'
import { cn } from '@/lib/utils'

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setLocation } = useLocation()
  const { data: presets } = useQuery({ queryKey: ['location-presets'], queryFn: () => api.getLocationPresets() })
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'denied'>('idle')

  function choosePreset(p: { label: string; sublabel: string; lat: number; lng: number }) {
    setLocation({ label: p.label, sublabel: p.sublabel, lat: p.lat, lng: p.lng })
    onClose()
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
          label: 'Current location', sublabel: 'Using your device location',
          lat: pos.coords.latitude, lng: pos.coords.longitude,
        })
        setGeoState('idle')
        onClose()
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title="Choose your location">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoState === 'loading'}
        className={cn(
          'mb-4 flex w-full items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left',
          'transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600">
          {geoState === 'loading' ? <IconLoader size={18} /> : <IconMapPin size={18} />}
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Use my current location</span>
          <span className="block text-xs text-ink/50">
            {geoState === 'denied' ? "Couldn't get your location — pick one below instead" : 'Fastest way to find shops near you'}
          </span>
        </span>
      </button>

      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">Demo locations</p>
      <div className="flex flex-col gap-2">
        {presets?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => choosePreset(p)}
            className="flex items-center gap-3 rounded-2xl border border-black/5 p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <IconMapPin size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{p.label}</span>
              <span className="block text-xs text-ink/50">{p.sublabel}</span>
            </span>
          </button>
        )) ?? <Button variant="ghost" disabled loading className="mx-auto" />}
      </div>
    </Sheet>
  )
}
