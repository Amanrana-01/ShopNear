import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { IconLoader } from './ui/Icon'

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F7F5FB]">
      <IconLoader size={32} className="text-brand-400" />
    </div>
  )
}

/** Gate for every screen except /login and /register — no bearer token, no
 * business screens. A CUSTOMER-role token would also fail here (getMe()
 * only ever returns a MERCHANT shape in this app; a mismatched role simply
 * can't produce a usable session). */
export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
