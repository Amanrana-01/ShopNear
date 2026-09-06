import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import type { OrderTypeValue, PaymentMode } from '@shopnear/shared'
import { api } from '@/api'
import { useCart } from '@/state/CartContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AlertCircle, CheckCircle2, CreditCard, Store, Truck, Wallet } from 'lucide-react'
import { formatRupees } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Checkout() {
  const cart = useCart()
  const navigate = useNavigate()
  const toast = useToast()
  const shop = cart.shop

  const [type, setType] = useState<OrderTypeValue>('RESERVE_AND_COLLECT')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH_ON_PICKUP')
  const [simulateOutcome, setSimulateOutcome] = useState<'success' | 'failure'>('success')
  const [note, setNote] = useState('')

  const deliveryFee = type === 'DELIVERY' ? (shop?.deliveryFee ?? 0) : 0
  const total = cart.subtotal + deliveryFee

  const placeOrder = useMutation({
    mutationFn: () => api.createOrder({
      shopId: shop!.id,
      type,
      items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      paymentMode,
      customerNote: note || undefined,
      simulatePaymentOutcome: paymentMode === 'MOCK_ONLINE' ? simulateOutcome : undefined,
    }),
    onSuccess: (order) => {
      cart.clearCart()
      toast.show('Reservation placed!', 'success')
      navigate(`/orders/${order.id}`, { replace: true })
    },
    onError: (err: unknown) => {
      toast.show(err instanceof Error ? err.message : 'Could not place order', 'error')
    },
  })

  if (!shop || cart.items.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <p className="p-6 text-center text-sm text-ink-muted">Your cart is empty.</p>
      </div>
    )
  }

  return (
    <div className="pb-32">
      <PageHeader title="Checkout" />

      <section className="mx-4 mt-3">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">How would you like this?</h2>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard active={type === 'RESERVE_AND_COLLECT'} onClick={() => setType('RESERVE_AND_COLLECT')} Icon={Store} title="Reserve & Collect" subtitle="Walk in, pay & pick up" />
          <OptionCard
            active={type === 'DELIVERY'} onClick={() => shop.acceptsDelivery && setType('DELIVERY')}
            Icon={Truck} title="Delivery" subtitle={shop.acceptsDelivery ? `₹${shop.deliveryFee} fee` : 'Not offered'}
            disabled={!shop.acceptsDelivery}
          />
        </div>
      </section>

      <section className="mx-4 mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Payment method</h2>
        <div className="flex flex-col gap-2">
          <PaymentRow
            active={paymentMode === (type === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH_ON_PICKUP')}
            onClick={() => setPaymentMode(type === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH_ON_PICKUP')}
            Icon={Wallet} label={type === 'DELIVERY' ? 'Cash on delivery' : 'Cash on pickup'}
          />
          <PaymentRow active={paymentMode === 'MOCK_ONLINE'} onClick={() => setPaymentMode('MOCK_ONLINE')} Icon={CreditCard} label="Pay online (mock)" />
        </div>

        {paymentMode === 'MOCK_ONLINE' && (
          <div className="mt-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-3.5">
            <p className="mb-2 text-xs font-semibold text-brand-700">Demo control — this is not a real payment gateway</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimulateOutcome('success')}
                className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold', simulateOutcome === 'success' ? 'bg-success-600 text-white' : 'bg-white text-ink-muted')}
              >
                <CheckCircle2 size={14} /> Simulate success
              </button>
              <button
                type="button"
                onClick={() => setSimulateOutcome('failure')}
                className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold', simulateOutcome === 'failure' ? 'bg-rose-600 text-white' : 'bg-white text-ink-muted')}
              >
                <AlertCircle size={14} /> Simulate failure
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mx-4 mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Note for the shop (optional)</h2>
        <textarea
          value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder="e.g. Please keep it at the counter for pickup after 6 pm"
          className="w-full resize-none rounded-2xl border border-black/10 p-3.5 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </section>

      <section className="mx-4 mt-5 rounded-card bg-white p-4 shadow-soft">
        <div className="flex justify-between text-sm text-ink-muted"><span>Subtotal</span><span>{formatRupees(cart.subtotal)}</span></div>
        <div className="flex justify-between text-sm text-ink-muted"><span>Delivery fee</span><span>{deliveryFee ? formatRupees(deliveryFee) : 'Free'}</span></div>
        <div className="mt-2 flex justify-between border-t border-dashed border-black/10 pt-2 text-base font-bold text-ink">
          <span>Total</span><span>{formatRupees(total)}</span>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] mx-auto max-w-lg px-4">
        <Button fullWidth size="lg" loading={placeOrder.isPending} onClick={() => placeOrder.mutate()}>
          {type === 'RESERVE_AND_COLLECT' ? 'Reserve now' : 'Place delivery order'} · {formatRupees(total)}
        </Button>
      </div>
    </div>
  )
}

function OptionCard({ active, onClick, Icon, title, subtitle, disabled }: {
  active: boolean; onClick: () => void; Icon: typeof Store; title: string; subtitle: string; disabled?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-colors',
        active ? 'border-brand bg-brand-50' : 'border-black/10 bg-white',
        disabled && 'opacity-40',
      )}
    >
      <Icon size={20} className={active ? 'text-brand-700' : 'text-ink-muted'} />
      <span className="text-sm font-bold text-ink">{title}</span>
      <span className="text-xs text-ink-muted">{subtitle}</span>
    </button>
  )
}

function PaymentRow({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: typeof Wallet; label: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border p-3.5 text-left', active ? 'border-brand bg-brand-50' : 'border-black/10 bg-white')}
    >
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', active ? 'bg-brand text-white' : 'bg-canvas-sunken text-ink-muted')}>
        <Icon size={17} />
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className={cn('ml-auto h-4 w-4 rounded-full border-2', active ? 'border-brand bg-brand' : 'border-black/20')} />
    </button>
  )
}
