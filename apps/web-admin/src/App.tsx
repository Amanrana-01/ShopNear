import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminShell } from '@/components/layout/AdminShell'
import { RequireAuth } from '@/components/RequireAuth'
import Login from '@/pages/Login'
import ShopApprovalQueue from '@/pages/ShopApprovalQueue'
import Catalogue from '@/pages/Catalogue'
import OrderExplorer from '@/pages/OrderExplorer'
import DisputeQueue from '@/pages/DisputeQueue'
import Dashboard from '@/pages/Dashboard'
import RankingDecayControls from '@/pages/RankingDecayControls'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminShell />}>
          <Route index element={<Navigate to="/shops" replace />} />
          <Route path="/shops" element={<ShopApprovalQueue />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/orders" element={<OrderExplorer />} />
          <Route path="/disputes" element={<DisputeQueue />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/ranking" element={<RankingDecayControls />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
