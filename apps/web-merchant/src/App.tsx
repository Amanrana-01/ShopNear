import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { FullScreenLoader, RequireAuth } from '@/components/RequireAuth'
import { ShopGate } from '@/components/ShopGate'
import { AppShell } from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import RegisterWizard from '@/pages/register/RegisterWizard'
import PendingApproval from '@/pages/PendingApproval'
import Suspended from '@/pages/Suspended'
import Dashboard from '@/pages/Dashboard'
import IncomingReservations from '@/pages/IncomingReservations'
import Inventory from '@/pages/Inventory'
import ShopProfile from '@/pages/ShopProfile'
import OrderHistory from '@/pages/OrderHistory'
import NotFound from '@/pages/NotFound'

function RootRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <FullScreenLoader />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterWizard />} />

      <Route element={<RequireAuth />}>
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/suspended" element={<Suspended />} />

        <Route element={<AppShell />}>
          <Route path="/shop/profile" element={<ShopProfile />} />

          <Route element={<ShopGate />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders/incoming" element={<IncomingReservations />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
