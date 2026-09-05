import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Order, OrderStatus } from '@shopnear/shared'
import { api } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ShopListSkeleton } from '@/components/ui/Skeleton'
import { IconPackage, IconChevronRight } from '@/components/ui/Icon'
import { formatRupees } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  PLACED: { label: 'Placed', className: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-amber-50 text-amber-700' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', className: 'bg-teal-50 text-teal-700' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', className: 'bg-teal-50 text-teal-700' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-600' },
  CANCELLED_BY_CUSTOMER: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700' },
  REJECTED_BY_SHOP: { label: 'Rejected', className: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: 'Expired', className: 'bg-rose-50 text-rose-700' },
}

function OrderRow({ order }: { order: Order }) {
  const status = STATUS_STYLE[order.status]
  return (
    <Link to={`/orders/${order.id}`} className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-soft transition-shadow hover:shadow-pop animate-fade-in-up">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <IconPackage size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-ink">{order.shop.name}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', status.className)}>{status.label}</span>
        </div>
        <p className="text-xs text-ink/45">
          {order.orderNumber} · {order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatRupees(order.total)}
        </p>
        <p className="text-[11px] text-ink/35">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      </div>
      <IconChevronRight size={18} className="shrink-0 text-ink/25" />
    </Link>
  )
}

export default function OrderHistory() {
  const query = useQuery({ queryKey: ['orders'], queryFn: () => api.listOrders() })

  return (
    <div>
      <PageHeader title="Your orders" />
      <div className="px-4 pb-8 pt-3">
        {query.isLoading && <ShopListSkeleton />}
        {query.isError && <ErrorState onRetry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && (
          <EmptyState icon={<IconPackage size={26} />} title="No orders yet" description="Reserve something nearby and it'll show up here." />
        )}
        {query.data && query.data.length > 0 && (
          <div className="flex flex-col gap-3">
            {query.data.map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  )
}
