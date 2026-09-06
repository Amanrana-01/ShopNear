import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useShop } from '@/state/ShopContext'
import { useIncomingOrders } from '@/state/IncomingCountContext'
import { completeOrder, ApiError } from '@/api/client'
import type { Order, OrderStatus } from '@/api/types'
import { ORDER_STATUSES } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { formatDateTime, formatRupees } from '@/lib/format'
import { cn } from '@/lib/utils'
import { IconClipboard, IconCheck } from '@/components/ui/Icon'

type DateFilter = 'today' | '7d' | '30d' | 'all'

function isWithin(iso: string, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const now = Date.now()
  const then = new Date(iso).getTime()
  const days = filter === 'today' ? 1 : filter === '7d' ? 7 : 30
  if (filter === 'today') {
    const d = new Date(iso)
    const n = new Date()
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
  }
  return now - then <= days * 86_400_000
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

const ACCEPTED_LIKE = new Set(['CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'])

function OrderDetailSheet({ order, onClose, onCompleted }: { order: Order | null; onClose: () => void; onCompleted: () => void }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [wrong, setWrong] = useState(false)

  if (!order) return null

  async function markComplete() {
    setSubmitting(true)
    setWrong(false)
    try {
      await completeOrder(order!.id, code.trim())
      show(t('orderHistory.completedToast'), 'success')
      onCompleted()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BAD_REQUEST') setWrong(true)
      else show(err instanceof ApiError ? err.message : t('common.networkError'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={!!order} onClose={onClose} title={t('incoming.orderNumber', { number: order.orderNumber })}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <OrderStatusBadge status={order.status} />
          <p className="text-sm text-ink/50">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink/80">{item.productNameSnapshot} × {item.quantity}</span>
              <span className="font-semibold text-ink">{formatRupees(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-brand-50 pt-2 font-display font-bold text-ink">
          <span>{t('orderHistory.totalValue')}</span>
          <span>{formatRupees(order.total)}</span>
        </div>
        {order.rejectionReason && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{order.rejectionReason}</p>
        )}
        {order.status === 'READY_FOR_PICKUP' && (
          <div className="mt-2 flex flex-col gap-2 border-t border-brand-50 pt-3">
            <p className="text-sm font-semibold text-ink/70">{t('orderHistory.enterPickupCode')}</p>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setWrong(false) }}
              />
              <Button loading={submitting} disabled={code.length !== 4} onClick={markComplete}>
                <IconCheck size={16} /> {t('orderHistory.markComplete')}
              </Button>
            </div>
            {wrong && <p className="text-sm font-semibold text-rose-600">{t('orderHistory.wrongCode')}</p>}
          </div>
        )}
      </div>
    </Sheet>
  )
}

export default function OrderHistory() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const queryClient = useQueryClient()
  const { orders, isLoading, error, refetch } = useIncomingOrders()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const dailySummary = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt))
    return {
      count: today.length,
      confirmed: today.filter((o) => ACCEPTED_LIKE.has(o.status)).length,
      rejected: today.filter((o) => o.status === 'REJECTED_BY_SHOP').length,
      value: today.filter((o) => o.status !== 'REJECTED_BY_SHOP' && o.status !== 'CANCELLED_BY_CUSTOMER' && o.status !== 'EXPIRED')
        .reduce((sum, o) => sum + o.total, 0),
    }
  }, [orders])

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (statusFilter === 'ALL' ? true : o.status === statusFilter))
      .filter((o) => isWithin(o.createdAt, dateFilter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, statusFilter, dateFilter])

  if (!activeShop) return null

  if (isLoading) {
    return <div className="px-4 py-5"><ListSkeleton count={4} /></div>
  }
  if (error) {
    return <ErrorState title={t('common.somethingWrong')} description={t('common.networkError')} onRetry={refetch} retryLabel={t('common.retry')} />
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-10">
      <h1 className="font-display text-xl font-bold text-ink">{t('orderHistory.title')}</h1>

      <Card className="p-4">
        <p className="mb-2 font-semibold text-ink/70">{t('orderHistory.dailySummaryTitle')}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-ink">{dailySummary.count}</p>
            <p className="text-xs text-ink/50">{t('dashboard.received')}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-teal-600">{dailySummary.confirmed}</p>
            <p className="text-xs text-ink/50">{t('dashboard.confirmed')}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-rose-500">{dailySummary.rejected}</p>
            <p className="text-xs text-ink/50">{t('dashboard.rejected')}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-brand-50 pt-3">
          <span className="text-sm text-ink/60">{t('orderHistory.totalValue')}</span>
          <span className="font-display font-bold text-brand-700">{formatRupees(dailySummary.value)}</span>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['today', '7d', '30d', 'all'] as DateFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={cn(
              'shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold',
              dateFilter === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 text-ink/50',
            )}
          >
            {f === 'today' ? t('orderHistory.today') : f === '7d' ? t('orderHistory.last7Days') : f === '30d' ? t('orderHistory.last30Days') : t('orderHistory.filterAll')}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={cn('shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold', statusFilter === 'ALL' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 text-ink/50')}
        >
          {t('orderHistory.filterAll')}
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn('shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold', statusFilter === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 text-ink/50')}
          >
            {t(`orderStatus.${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconClipboard size={26} />} title={t('orderHistory.noOrders')} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((order) => (
            <button
              key={order.id}
              onClick={() => setDetailOrder(order)}
              className="flex items-center justify-between gap-3 rounded-card bg-white p-3 text-left shadow-soft"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{t('incoming.orderNumber', { number: order.orderNumber })}</p>
                <p className="text-xs text-ink/50">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <OrderStatusBadge status={order.status} />
                <p className="text-sm font-bold text-ink">{formatRupees(order.total)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <OrderDetailSheet
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onCompleted={() => queryClient.invalidateQueries({ queryKey: ['shop-orders', activeShop.id] })}
      />
    </div>
  )
}
