import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ChevronRight, ClipboardList, Timer } from 'lucide-react'
import type { Order, OrderStatus } from '@shopnear/shared'
import { api } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ShopListSkeleton } from '@/components/ui/Skeleton'
import { formatRupees, formatRelativeTime, pluralize } from '@/lib/format'
import { shopMeta } from '@/lib/shopMeta'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Live states get colour and a pulse; finished ones go quiet. That contrast
 * is the whole point of the list — you should be able to see at a glance
 * whether anything still needs you. */
const STATUS_STYLE: Record<OrderStatus, { label: string; className: string; live?: boolean }> = {
  PLACED: { label: 'Waiting for shop', className: 'bg-amber-50 text-amber-700', live: true },
  CONFIRMED: { label: 'Confirmed', className: 'bg-brand-50 text-brand-700', live: true },
  READY_FOR_PICKUP: { label: 'Ready for pickup', className: 'bg-success-50 text-success-700', live: true },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', className: 'bg-success-50 text-success-700', live: true },
  COMPLETED: { label: 'Completed', className: 'bg-canvas-sunken text-ink-muted' },
  CANCELLED_BY_CUSTOMER: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700' },
  REJECTED_BY_SHOP: { label: 'Rejected', className: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: 'Expired', className: 'bg-rose-50 text-rose-700' },
}

function OrderRow({ order }: { order: Order }) {
  const status = STATUS_STYLE[order.status]
  const meta = shopMeta(order.shop.type)

  return (
    <Link
      to={`/orders/${order.id}`}
      className={cn(
        'flex items-start gap-3 rounded-card bg-white p-3.5 shadow-tile',
        'transition-shadow hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        status.live && 'ring-1 ring-brand-100',
      )}
    >
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', meta.tile)}>
        <meta.Icon size={22} strokeWidth={1.7} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-bold text-ink">{order.shop.name}</p>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide',
              status.className,
            )}
          >
            {status.live && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
            )}
            {status.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-ink-muted">
          {order.orderNumber} · {order.items.length} {pluralize(order.items.length, 'item')} ·{' '}
          <span className="font-bold text-ink">{formatRupees(order.total)}</span>
        </p>

        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
          <Timer size={11} aria-hidden />
          {formatRelativeTime(order.createdAt)}
          {order.type === 'RESERVE_AND_COLLECT' ? ' · Reserve & collect' : ' · Delivery'}
        </p>
      </div>

      <ChevronRight size={18} className="mt-3 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  )
}

export default function OrderHistory() {
  const m = useAppMotion()
  // Live orders advance on a timer in the mock backend, so this list has to
  // re-check rather than sit on a stale snapshot.
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.listOrders(),
    refetchInterval: 5_000,
  })

  const live = (query.data ?? []).filter((o) => STATUS_STYLE[o.status].live)
  const past = (query.data ?? []).filter((o) => !STATUS_STYLE[o.status].live)

  return (
    <div>
      <PageHeader
        title="Your orders"
        subtitle={live.length > 0 ? `${live.length} in progress` : undefined}
      />

      <div className="px-4 pb-8 pt-3 lg:px-0">
        {query.isLoading && <ShopListSkeleton />}
        {query.isError && <ErrorState onRetry={() => query.refetch()} />}
        {query.data?.length === 0 && (
          <EmptyState
            icon={<ClipboardList size={26} aria-hidden />}
            title="No orders yet"
            description="Reserve something nearby and it'll show up here, with live status until you collect it."
          />
        )}

        {live.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-2xs font-black uppercase tracking-wider text-ink-faint">
              In progress
            </h2>
            <motion.div
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="grid gap-2.5 md:grid-cols-2"
            >
              {live.map((o) => (
                <motion.div key={o.id} variants={m.variants(itemVariants)}>
                  <OrderRow order={o} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="mb-2 text-2xs font-black uppercase tracking-wider text-ink-faint">
              Earlier
            </h2>
            <motion.div
              variants={m.variants(listVariants)}
              initial="hidden"
              animate="show"
              className="grid gap-2.5 md:grid-cols-2"
            >
              {past.map((o) => (
                <motion.div key={o.id} variants={m.variants(itemVariants)}>
                  <OrderRow order={o} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </div>
    </div>
  )
}
