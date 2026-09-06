import { Navigate, Outlet } from 'react-router-dom'
import { useShop } from '@/state/ShopContext'
import { FullScreenLoader } from './RequireAuth'

/** Wraps every business screen (dashboard, incoming reservations, inventory,
 * order history) — a PENDING shop cannot receive orders yet (spec §5) and a
 * SUSPENDED shop cannot receive new ones either, so both bounce to their own
 * status screen instead of rendering a business page that would silently do
 * nothing. Shop profile and the registration wizard are NOT behind this gate
 * — editing the profile is explicitly still allowed while pending. */
export function ShopGate() {
  const { activeShop, shops } = useShop()

  if (shops.length === 0) return <FullScreenLoader />
  if (!activeShop) return <FullScreenLoader />
  if (activeShop.status === 'PENDING') return <Navigate to="/pending" replace />
  if (activeShop.status === 'SUSPENDED') return <Navigate to="/suspended" replace />
  return <Outlet />
}
