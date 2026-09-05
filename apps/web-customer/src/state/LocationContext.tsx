import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { GeoPoint, RadiusMeters } from '@shopnear/shared'

export interface ActiveLocation extends GeoPoint {
  label: string
  sublabel?: string
}

interface LocationContextValue {
  location: ActiveLocation | null
  radiusMeters: RadiusMeters
  setLocation: (loc: ActiveLocation) => void
  setRadiusMeters: (r: RadiusMeters) => void
  clearLocation: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)
const STORAGE_KEY = 'shopnear.location.v1'
const RADIUS_KEY = 'shopnear.radius.v1'

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<ActiveLocation | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as ActiveLocation) : null
    } catch {
      return null
    }
  })
  const [radiusMeters, setRadiusMetersState] = useState<RadiusMeters>(() => {
    try {
      const raw = localStorage.getItem(RADIUS_KEY)
      return raw ? (JSON.parse(raw) as RadiusMeters) : 1000
    } catch {
      return 1000
    }
  })

  useEffect(() => {
    if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  }, [location])
  useEffect(() => {
    localStorage.setItem(RADIUS_KEY, JSON.stringify(radiusMeters))
  }, [radiusMeters])

  const setLocation = useCallback((loc: ActiveLocation) => setLocationState(loc), [])
  const clearLocation = useCallback(() => {
    setLocationState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ location, radiusMeters, setLocation, setRadiusMeters: setRadiusMetersState, clearLocation }),
    [location, radiusMeters, setLocation, clearLocation],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
