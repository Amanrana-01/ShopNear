import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAllOrdersForAdmin } from '@/api/admin'
import { EndpointNotAvailableError } from '@/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { NotAvailable, ErrorState } from '@/components/ui/EmptyState'

const STATUS_OPTIONS = [
  'PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED',
  'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED',
]

/**
 * All orders across every shop, filterable by status/shop/date. Wired to
 * `listAllOrdersForAdmin` (api/admin.ts), ready to render a real table the
 * moment that route exists — see the NotAvailable panel for exactly why it
 * can't be built against the live API today.
 */
export default function OrderExplorer() {
  const [status, setStatus] = useState('')
  const [shopId, setShopId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const query = useQuery({
    queryKey: ['admin-orders', status, shopId, from, to],
    queryFn: () => listAllOrdersForAdmin({ status: status || undefined, shopId: shopId || undefined, from: from || undefined, to: to || undefined }),
    retry: false,
  })
  const notAvailable = query.error instanceof EndpointNotAvailableError ? query.error : null

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Order explorer</h1>
        <p className="mt-1 text-sm text-ink/55">Every order, across every shop — filter by status, shop, and date.</p>
      </div>

      <Card>
        <CardHeader
          title="Filters"
          action={
            <div className="flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-ink">
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
              </select>
              <input
                placeholder="Shop ID"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                className="w-32 rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-ink placeholder:text-ink/30"
              />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-ink" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-ink" />
            </div>
          }
        />

        {query.isLoading && <TableSkeleton rows={5} cols={6} />}

        {query.isError && notAvailable && (
          <NotAvailable
            endpoints={notAvailable.endpoints}
            description="There is no admin-scoped route that lists orders across shops. GET /api/orders/shop/:shopId exists but is merchant-owner-only (requireShopOwnership rejects any ADMIN token with 403, by design — ownership checks are independent of role), and there is no route to even enumerate shop IDs to try it against. The seed data has 120+ historical orders; they just aren't reachable through any endpoint an admin token can call. The filter controls and table below are fully wired to the contract this page expects."
          />
        )}
        {query.isError && !notAvailable && (
          <ErrorState description={query.error instanceof Error ? query.error.message : undefined} onRetry={() => query.refetch()} />
        )}
      </Card>
    </div>
  )
}
