import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useShop } from '@/state/ShopContext'
import { useIncomingOrders } from '@/state/IncomingCountContext'
import { getAllShopInventory, confirmOrder, rejectOrder, ApiError } from '@/api/client'
import type { Order, FulfilmentStatus } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { formatCountdown, formatRupees } from '@/lib/format'
import {
  IconBell, IconCheck, IconX, IconClock, IconPackage, IconVolume, IconAlert,
} from '@/components/ui/Icon'

/** Live mm:ss (or h:mm:ss) countdown to `expiresAt`, ticking every second. */
function useCountdown(expiresAt: string | null): { label: string; expired: boolean } {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!expiresAt) return { label: '—', expired: false }
  const remaining = new Date(expiresAt).getTime() - now
  return { label: formatCountdown(remaining), expired: remaining <= 0 }
}

function ReservationCard({ order, imageFor, index, total }: {
  order: Order
  imageFor: (productId: string) => string | null
  index: number
  total: number
}) {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const { activeShop } = useShop()
  const { label: countdownLabel, expired } = useCountdown(order.expiresAt)
  const [resolutions, setResolutions] = useState<Record<string, FulfilmentStatus>>({})
  const [confirming, setConfirming] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  // Fresh per order — a merchant who reject-then-confirms a different order
  // shouldn't carry stale answers across cards.
  useEffect(() => { setResolutions({}) }, [order.id])

  const allResolved = order.items.every((i) => resolutions[i.id])

  async function refetchQueue() {
    await queryClient.invalidateQueries({ queryKey: ['shop-orders', activeShop?.id] })
  }

  async function onConfirm() {
    setConfirming(true)
    try {
      await confirmOrder(
        order.id,
        order.items.map((i) => ({ orderItemId: i.id, fulfilmentStatus: resolutions[i.id] })),
      )
      show(t('incoming.confirmedToast'), 'success')
      await refetchQueue()
    } catch (e) {
      show(e instanceof ApiError ? e.message : t('common.networkError'), 'error')
    } finally {
      setConfirming(false)
    }
  }

  async function onReject() {
    setRejecting(true)
    try {
      await rejectOrder(order.id, rejectReason.trim() || 'Not specified')
      show(t('incoming.rejectedToast'), 'success')
      setRejectOpen(false)
      setRejectReason('')
      await refetchQueue()
    } catch (e) {
      show(e instanceof ApiError ? e.message : t('common.networkError'), 'error')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink/60">{t('incoming.counter', { current: index + 1, total })}</p>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
            expired ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          <IconClock size={16} />
          {countdownLabel}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-ink">{t('incoming.orderNumber', { number: order.orderNumber })}</p>
          <p className="font-display text-lg font-bold text-brand-700">{formatRupees(order.total)}</p>
        </div>
        {expired && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-rose-600">
            <IconAlert size={14} /> {t('incoming.expired')}
          </p>
        )}
        {order.customerNote && (
          <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-ink/70">
            <span className="font-semibold">{t('incoming.customerNote')}: </span>{order.customerNote}
          </p>
        )}
      </Card>

      <p className="text-sm font-semibold text-ink/60">{t('incoming.resolveAllHint')}</p>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {order.items.map((item) => {
          const img = imageFor(item.productId)
          const resolved = resolutions[item.id]
          return (
            <Card key={item.id} className="p-3">
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <IconPackage size={26} className="text-brand-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.productNameSnapshot}</p>
                  <p className="text-xs text-ink/55">{item.unitLabelSnapshot}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink/70">
                    {t('incoming.quantityLabel', { qty: item.quantity })} · {t('incoming.unitPriceLabel', { price: item.unitPrice })}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutions((r) => ({ ...r, [item.id]: 'AVAILABLE' }))}
                  className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition-colors active:scale-[0.97] ${
                    resolved === 'AVAILABLE'
                      ? 'border-teal-600 bg-teal-600 text-white shadow-soft'
                      : 'border-teal-200 bg-white text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  <IconCheck size={20} /> {t('incoming.haveIt')}
                </button>
                <button
                  type="button"
                  onClick={() => setResolutions((r) => ({ ...r, [item.id]: 'UNAVAILABLE' }))}
                  className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition-colors active:scale-[0.97] ${
                    resolved === 'UNAVAILABLE'
                      ? 'border-rose-600 bg-rose-600 text-white shadow-soft'
                      : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <IconX size={20} /> {t('incoming.dontHaveIt')}
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Button size="xl" fullWidth disabled={!allResolved} loading={confirming} onClick={onConfirm}>
          {confirming ? t('incoming.confirmOrderProcessing') : t('incoming.confirmOrder')}
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => setRejectOpen(true)}>
          {t('incoming.rejectOrder')}
        </Button>
      </div>

      <Sheet open={rejectOpen} onClose={() => setRejectOpen(false)} title={t('incoming.rejectOrder')}>
        <p className="mb-2 text-sm font-semibold text-ink/70">{t('incoming.rejectReasonLabel')}</p>
        <Textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('incoming.rejectReasonPlaceholder')}
        />
        <Button variant="danger" size="lg" fullWidth className="mt-4" loading={rejecting} onClick={onReject}>
          {t('incoming.rejectSubmit')}
        </Button>
      </Sheet>
    </div>
  )
}

export default function IncomingReservations() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const { placedOrders, isLoading, error, refetch, soundEnabled, setSoundEnabled } = useIncomingOrders()

  const inventoryQuery = useQuery({
    queryKey: ['shop-inventory-all', activeShop?.id],
    queryFn: () => getAllShopInventory(activeShop!.id),
    enabled: !!activeShop,
    staleTime: 60_000,
  })

  const imageMap = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const item of inventoryQuery.data ?? []) m.set(item.productId, item.product.imageUrl)
    return m
  }, [inventoryQuery.data])

  if (isLoading) {
    return (
      <div className="px-4 py-5">
        <ListSkeleton count={2} />
      </div>
    )
  }

  if (error) {
    return <ErrorState title={t('common.somethingWrong')} description={t('common.networkError')} onRetry={refetch} retryLabel={t('common.retry')} />
  }

  return (
    <div className="flex min-h-[calc(100dvh-160px)] flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="font-display text-xl font-bold text-ink">{t('incoming.title')}</h1>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label={soundEnabled ? t('incoming.muteSound') : t('incoming.unmuteSound')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        >
          <IconVolume size={18} muted={!soundEnabled} />
        </button>
      </div>

      {placedOrders.length === 0 ? (
        <EmptyState
          icon={<IconBell size={28} />}
          title={t('incoming.emptyTitle')}
          description={t('incoming.emptyDescription')}
        />
      ) : (
        <ReservationCard
          key={placedOrders[0].id}
          order={placedOrders[0]}
          imageFor={(productId) => imageMap.get(productId) ?? null}
          index={0}
          total={placedOrders.length}
        />
      )}
    </div>
  )
}
