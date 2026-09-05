import { useNavigate } from 'react-router-dom'
import { useCart } from '@/state/CartContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconMinus, IconPlus, IconTrash, IconBag, IconStore } from '@/components/ui/Icon'
import { formatRupees } from '@/lib/format'

export default function Cart() {
  const cart = useCart()
  const navigate = useNavigate()

  if (cart.items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState
          icon={<IconBag size={26} />}
          title="Your cart is empty"
          description="Find something nearby and reserve it — collect and pay at the shop."
          action={{ label: 'Start shopping', onClick: () => navigate('/home') }}
        />
      </div>
    )
  }

  return (
    <div className="pb-32">
      <PageHeader title="Cart" />

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3">
        <IconStore size={18} className="text-brand-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{cart.shop?.name}</p>
          <p className="text-xs text-ink/50">All items in one cart are reserved at this shop</p>
        </div>
      </div>

      <ul className="mx-4 mt-3 flex flex-col gap-3">
        {cart.items.map((item) => (
          <li key={item.product.id} className="flex gap-3 rounded-card bg-white p-3 shadow-soft">
            <img src={item.product.imageUrl ?? undefined} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-brand-50 object-contain p-1.5" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-ink">{item.product.name}</p>
              <p className="text-xs text-ink/45">{item.product.defaultUnitLabel}</p>
              <AvailabilityBadge availability={item.availability} availabilityUpdatedAt={item.availabilityUpdatedAt} size="compact" className="mt-1" />
            </div>
            <div className="flex shrink-0 flex-col items-end justify-between">
              <button
                type="button"
                aria-label={`Remove ${item.product.name}`}
                onClick={() => cart.removeItem(item.product.id)}
                className="text-ink/30 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                <IconTrash size={16} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-brand-50 px-1">
                  <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQuantity(item.product.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-brand-700 active:scale-90">
                    <IconMinus size={13} />
                  </button>
                  <span className="min-w-[1rem] text-center text-sm font-bold tabular-nums text-ink">{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => cart.setQuantity(item.product.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-brand-700 active:scale-90">
                    <IconPlus size={13} />
                  </button>
                </div>
              </div>
              <span className="text-sm font-bold text-ink">{formatRupees(item.unitPrice * item.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-4 mt-4 rounded-card bg-white p-4 shadow-soft">
        <div className="flex justify-between text-sm text-ink/60">
          <span>Subtotal ({cart.itemCount} item{cart.itemCount > 1 ? 's' : ''})</span>
          <span className="font-semibold text-ink">{formatRupees(cart.subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-ink/40">Delivery fee (if chosen) and final total shown at checkout.</p>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] mx-auto max-w-lg px-4">
        <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>
          Proceed to reserve · {formatRupees(cart.subtotal)}
        </Button>
      </div>
    </div>
  )
}
