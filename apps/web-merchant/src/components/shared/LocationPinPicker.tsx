import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { haversineMetres, formatDistance } from '@/lib/format'
import { IconMapPin, IconChevronLeft, IconChevronRight, IconChevronDown, IconChevronUp } from '@/components/ui/Icon'

const METRES_PER_DEGREE_LAT = 111_320
const VIEW_SIZE_PX = 280
const VIEW_SPAN_METRES = 1000 // the box shows roughly a 1 km square
const METRES_PER_PIXEL = VIEW_SPAN_METRES / VIEW_SIZE_PX
const NUDGE_METRES = 15

/**
 * A fully offline draggable "map" pin. There is no tile server this app is
 * allowed to call (spec: fully offline, no CDN, no third-party calls), so
 * real map tiles (Leaflet/OSM, Google Maps) are off the table — this
 * renders a decorative grid standing in for streets and projects lat/lng to
 * pixels with a fixed local metres-per-pixel scale, which is accurate
 * enough at neighbourhood scale for placing a shop pin.
 *
 * The spec's "warn if the pin is >200 m from the typed address" needs a
 * geocoder to resolve free-text address -> lat/lng, which is equally
 * unavailable offline. The honest substitute implemented here: compare the
 * pin against the browser's own geolocation (a real device signal, not a
 * simulation) when permission is granted, and warn if they diverge by more
 * than 200 m.
 */
export function LocationPinPicker({
  lat, lng, onChange,
}: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const { t } = useTranslation()
  const originRef = useRef({ lat, lng })
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoDenied, setGeoDenied] = useState(false)

  const metresPerDegreeLng = METRES_PER_DEGREE_LAT * Math.cos((originRef.current.lat * Math.PI) / 180)

  function latLngToOffsetPx(pLat: number, pLng: number) {
    const dxMetres = (pLng - originRef.current.lng) * metresPerDegreeLng
    const dyMetres = (originRef.current.lat - pLat) * METRES_PER_DEGREE_LAT
    return { x: dxMetres / METRES_PER_PIXEL, y: dyMetres / METRES_PER_PIXEL }
  }
  function offsetPxToLatLng(dx: number, dy: number) {
    const dLat = -(dy * METRES_PER_PIXEL) / METRES_PER_DEGREE_LAT
    const dLng = (dx * METRES_PER_PIXEL) / metresPerDegreeLng
    return { lat: originRef.current.lat + dLat, lng: originRef.current.lng + dLng }
  }

  const offset = latLngToOffsetPx(lat, lng)
  const clampedOffset = {
    x: Math.max(-VIEW_SIZE_PX / 2 + 16, Math.min(VIEW_SIZE_PX / 2 - 16, offset.x)),
    y: Math.max(-VIEW_SIZE_PX / 2 + 16, Math.min(VIEW_SIZE_PX / 2 - 16, offset.y)),
  }

  const movePinBy = useCallback((dxPx: number, dyPx: number) => {
    const current = latLngToOffsetPx(lat, lng)
    const next = offsetPxToLatLng(current.x + dxPx, current.y + dyPx)
    onChange(next.lat, next.lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, onChange])

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const next = offsetPxToLatLng(e.clientX - cx, e.clientY - cy)
      onChange(next.lat, next.lng)
    }
    function onPointerUp() {
      draggingRef.current = false
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoDenied(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setDeviceLocation(p)
        originRef.current = p
        onChange(p.lat, p.lng)
        setLocating(false)
      },
      () => {
        setGeoDenied(true)
        setLocating(false)
      },
      { timeout: 8000 },
    )
  }

  // Passive background check: if geolocation was already granted earlier in
  // this session, keep comparing against it without forcing a prompt.
  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
      if (status.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { timeout: 5000 },
        )
      }
    }).catch(() => {})
  }, [])

  const distanceFromDevice = deviceLocation ? haversineMetres(lat, lng, deviceLocation.lat, deviceLocation.lng) : null
  const farFromDevice = distanceFromDevice !== null && distanceFromDevice > 200

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="relative mx-auto h-[280px] w-[280px] touch-none select-none overflow-hidden rounded-2xl border-2 border-brand-100"
        style={{
          backgroundImage:
            'linear-gradient(#EAE0FC 1px, transparent 1px), linear-gradient(90deg, #EAE0FC 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          backgroundColor: '#FAF8FF',
        }}
      >
        <div
          role="slider"
          aria-label="Shop location pin"
          aria-valuenow={0}
          tabIndex={0}
          onPointerDown={(e) => { e.preventDefault(); draggingRef.current = true }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') movePinBy(0, -20)
            if (e.key === 'ArrowDown') movePinBy(0, 20)
            if (e.key === 'ArrowLeft') movePinBy(-20, 0)
            if (e.key === 'ArrowRight') movePinBy(20, 0)
          }}
          className="absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-full cursor-grab items-center justify-center text-brand-600 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          style={{ left: `calc(50% + ${clampedOffset.x}px)`, top: `calc(50% + ${clampedOffset.y}px)` }}
        >
          <IconMapPin size={36} className="drop-shadow-md" fill="#7B2FBE" />
        </div>
        {/* centre crosshair, purely decorative */}
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200" />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button type="button" aria-label="Move left" onClick={() => movePinBy(-NUDGE_METRES / METRES_PER_PIXEL, 0)} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><IconChevronLeft size={18} /></button>
        <div className="flex flex-col gap-1">
          <button type="button" aria-label="Move up" onClick={() => movePinBy(0, -NUDGE_METRES / METRES_PER_PIXEL)} className="flex h-9 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><IconChevronUp size={18} /></button>
          <button type="button" aria-label="Move down" onClick={() => movePinBy(0, NUDGE_METRES / METRES_PER_PIXEL)} className="flex h-9 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><IconChevronDown size={18} /></button>
        </div>
        <button type="button" aria-label="Move right" onClick={() => movePinBy(NUDGE_METRES / METRES_PER_PIXEL, 0)} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><IconChevronRight size={18} /></button>
      </div>

      <p className="text-center text-xs text-ink/50">{t('register.location.dragPinHint')}</p>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-brand-600 disabled:opacity-50"
      >
        <IconMapPin size={16} />
        {locating ? t('register.location.locating') : t('register.location.useMyLocation')}
      </button>

      {geoDenied && <p className="text-center text-xs text-ink/45">{t('register.location.locationDenied')}</p>}
      {farFromDevice && distanceFromDevice !== null && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
          {t('register.location.warningFar', { distance: formatDistance(distanceFromDevice) })}
        </p>
      )}
      {deviceLocation && !farFromDevice && (
        <p className="text-center text-xs font-medium text-teal-700">{t('register.location.confirmedClose')}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs text-ink/50">
        <p>{t('register.location.latLabel')}: {lat.toFixed(5)}</p>
        <p>{t('register.location.lngLabel')}: {lng.toFixed(5)}</p>
      </div>
    </div>
  )
}
