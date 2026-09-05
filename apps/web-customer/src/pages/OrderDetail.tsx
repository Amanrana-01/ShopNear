import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { OrderStatus, DisputeReason } from '@shopnear/shared'
import { api } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { StarRating } from '@/components/ui/StarRating'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  IconCheckCircle, IconClock, IconPackage, IconTruck, IconStore, IconX,
} from '@/components/ui/Icon'
import { formatCountdown, formatRupees, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const RESERVE_STEPS: { status: OrderStatus; label: string; Icon: typeof IconCheckCircle }[] = [
  { status: 'PLACED', label: 'Placed', Icon: IconClock },
  { status: 'CONFIRMED', label: 'Confirmed', Icon: IconCheckCircle },
  { status: 'READY_FOR_PICKUP', label: 'Ready for pickup', Icon: IconPackage },
  { status: 'COMPLETED', label: 'Completed', Icon: IconStore },
]
const DELIVERY_STEPS: { status: OrderStatus; label: string; Icon: typeof IconCheckCircle }[] = [
  { status: 'PLACED', label: 'Placed', Icon: IconClock },
  { status: 'CONFIRMED', label: 'Confirmed', Icon: IconCheckCircle },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', Icon: IconTruck },
  { status: 'COMPLETED', label: 'Delivered', Icon: IconStore },
]

const TERMINAL: OrderStatus[] = ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED']
const DISPUTE_REASONS: { value: DisputeReason; label: string }[] = [
  { value: 'ITEM_NOT_AVAILABLE_ON_ARRIVAL', label: 'Item wasn’t actually available' },
  { value: 'PRICE_MISMATCH', label: 'Price charged didn’t match' },
  { value: 'QUALITY_ISSUE', label: 'Quality issue' },
  { value: 'SHOP_CLOSED', label: 'Shop was closed' },
  { value: 'OTHER', label: 'Something else' },
]

export default function OrderDetail() {
  const { id = '' } = useParams()
  const toast = useToast()
  const qc = useQueryClient()
  const [now, setNow] = useState(Date.now())

  const query = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data && TERMINAL.includes(q.state.data.status) ? false : 3000),
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelOrder(id),
    onSuccess: () => { toast.show('Reservation cancelled', 'info'); qc.invalidateQueries({ queryKey: ['order', id] }) },
    onError: (e: unknown) => toast.show(e instanceof Error ? e.message : 'Could not cancel', 'error'),
  })

  const order = query.data

  if (query.isLoading) {
    return <div><PageHeader title="Order" /><div className="p-4"><Skeleton className="h-48 w-full rounded-2xl" /></div></div>
  }
  if (query.isError || !order) {
    return <div><PageHeader title="Order" /><ErrorState onRetry={() => query.refetch()} /></div>
  }

  const steps = order.type === 'DELIVERY' ? DELIVERY_STEPS : RESERVE_STEPS
  const isTerminal = TERMINAL.includes(order.status)
  const isBad = order.status === 'CANCELLED_BY_CUSTOMER' || order.status === 'REJECTED_BY_SHOP' || order.status === 'EXPIRED'
  const currentStepIndex = steps.findIndex((s) => s.status === order.status)
  const canCancel = (order.status === 'PLACED' || order.status === 'CONFIRMED')

  return (
    <div className="pb-10">
      <PageHeader title={`Order ${order.orderNumber}`} />

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-soft">
        <IconStore size={18} className="shrink-0 text-brand-600" />
        <Link to={`/shop/${order.shop.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:underline">
          {order.shop.name}
        </Link>
        <span className="shrink-0 text-xs text-ink/45">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
      </div>

      {isBad ? (
        <div className="mx-4 mt-4 rounded-card bg-rose-50 p-4 text-rose-700">
          <p className="flex items-center gap-2 font-display text-sm font-bold">
            <IconX size={16} />
            {order.status === 'CANCELLED_BY_CUSTOMER' && 'You cancelled this order'}
            {order.status === 'REJECTED_BY_SHOP' && 'The shop couldn’t fulfil this order'}
            {order.status === 'EXPIRED' && 'This reservation expired, uncollected'}
          </p>
          {order.rejectionReason && <p className="mt-1 text-xs">{order.rejectionReason}</p>}
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-card bg-white p-4 shadow-soft">
          <ol className="flex items-center">
            {steps.map((step, i) => {
              const done = i <= currentStepIndex
              return (
                <li key={step.status} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
                  <div className="flex w-full items-center">
                    {i > 0 && <span className={cn('h-0.5 flex-1', i <= currentStepIndex ? 'bg-brand' : 'bg-black/10')} />}
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', done ? 'bg-brand text-white' : 'bg-black/5 text-ink/30')}>
                      <step.Icon size={15} />
                    </span>
                    {i < steps.length - 1 && <span className={cn('h-0.5 flex-1', i < currentStepIndex ? 'bg-brand' : 'bg-black/10')} />}
                  </div>
                  <span className={cn('text-center text-[10px] font-medium', done ? 'text-ink' : 'text-ink/35')}>{step.label}</span>
                </li>
              )
            })}
          </ol>

          {!isTerminal && order.type === 'RESERVE_AND_COLLECT' && (
            <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Show this code at the shop</p>
              <p className="my-1 font-display text-4xl font-black tracking-[0.3em] text-brand-800">{order.pickupCode}</p>
              {order.expiresAt && (
                <p className="text-xs text-brand-700/80">
                  Reservation expires in {formatCountdown(new Date(order.expiresAt).getTime() - now)}
                </p>
              )}
            </div>
          )}

          {canCancel && (
            <Button variant="outline" size="sm" fullWidth className="mt-4" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              Cancel reservation
            </Button>
          )}
        </div>
      )}

      <div className="mx-4 mt-4 rounded-card bg-white p-4 shadow-soft">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">Items</h2>
        <ul className="flex flex-col divide-y divide-black/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <img src={item.imageUrl ?? undefined} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-brand-50 object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{item.productNameSnapshot}</p>
                <p className="text-xs text-ink/45">{item.quantity} × {item.unitLabelSnapshot} · {formatRupees(item.unitPrice)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink">{formatRupees(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-dashed border-black/10 pt-2 text-sm font-bold text-ink">
          <span>Total</span><span>{formatRupees(order.total)}</span>
        </div>
      </div>

      {order.status === 'COMPLETED' && <ReviewSection orderId={order.id} existingReview={order.review} />}
      {(order.status === 'COMPLETED' || order.status === 'REJECTED_BY_SHOP') && <DisputeSection orderId={order.id} />}
    </div>
  )
}

function ReviewSection({ orderId, existingReview }: { orderId: string; existingReview: { rating: number; comment: string | null } | null }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')

  const mutation = useMutation({
    mutationFn: () => api.submitReview({ orderId, rating, comment: comment || undefined }),
    onSuccess: () => { toast.show('Thanks for the review!', 'success'); qc.invalidateQueries({ queryKey: ['order', orderId] }) },
    onError: () => toast.show('Could not submit review', 'error'),
  })

  return (
    <div className="mx-4 mt-4 rounded-card bg-white p-4 shadow-soft">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/45">{existingReview ? 'Your review' : 'Rate this shop'}</h2>
      <StarRating value={rating} onChange={existingReview ? undefined : setRating} readOnly={!!existingReview} size={24} />
      {existingReview ? (
        existingReview.comment && <p className="mt-2 text-sm text-ink/70">“{existingReview.comment}”</p>
      ) : (
        <>
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
            placeholder="How was it? (optional)"
            className="mt-3 w-full resize-none rounded-2xl border border-black/10 p-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button size="sm" className="mt-2" disabled={rating === 0} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Submit review
          </Button>
        </>
      )}
    </div>
  )
}

function DisputeSection({ orderId }: { orderId: string }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<DisputeReason>('ITEM_NOT_AVAILABLE_ON_ARRIVAL')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.raiseDispute({ orderId, reason, description }),
    onSuccess: (d) => {
      toast.show('Dispute raised — our team will follow up', 'success')
      setSubmitted(formatRelativeTime(d.createdAt))
      setOpen(false)
    },
    onError: () => toast.show('Could not raise dispute', 'error'),
  })

  return (
    <div className="mx-4 mt-4">
      {submitted ? (
        <p className="rounded-2xl bg-amber-50 p-3.5 text-center text-xs font-medium text-amber-700">
          Dispute submitted {submitted} — status: open
        </p>
      ) : (
        <Button variant="outline" size="sm" fullWidth onClick={() => setOpen(true)}>Raise a dispute</Button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Raise a dispute">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">What went wrong?</legend>
          {DISPUTE_REASONS.map((r) => (
            <label key={r.value} className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm', reason === r.value ? 'border-brand bg-brand-50' : 'border-black/10')}>
              <input type="radio" name="dispute-reason" checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-brand" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Tell us more (required)"
          className="mt-3 w-full resize-none rounded-2xl border border-black/10 p-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button fullWidth className="mt-3" disabled={description.trim().length < 5} loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Submit dispute
        </Button>
      </Sheet>
    </div>
  )
}
