import { Navigate, Outlet } from 'react-router-dom'
import { useLocation } from '@/state/LocationContext'

/** Every screen past the gate assumes a location is set — this guard sends
 * anyone who lands deep-linked (or after clearing their location) back to
 * the gate instead of rendering a broken "near you" page with no anchor. */
export function RequireLocation() {
  const { location } = useLocation()
  if (!location) return <Navigate to="/" replace />
  return <Outlet />
}
