import { useState } from 'react'
import type { Product, Offer, ShopSummary } from '@shopnear/shared'
import { useCart, CartConflictError } from '@/state/CartContext'
import { useToast } from '@/components/ui/Toast'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { IconPlus, IconMinus } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

interface AddToCartControlProps {
  shop: ShopSummary
  product: Product
  offer: Offer
  size?: 'sm' | 'md'
  className?: string
}

/** The signature quick-commerce interaction: an ADD pill that flips in place
 * into a stepper on tap. Reserve semantics, not "buy now" — but the tactile
 * feel should match Blinkit/Zepto exactly. */
export function AddToCartControl({ shop, product, offer, size = 'md', className }: AddToCartControlProps) {
  const cart = useCart()
  const toast = useToast()
  const [conflictShop, setConflictShop] = useState<ShopSummary | null>(null)
  const qty = cart.quantityFor(product.id)
  const disabled = offer.availability === 'OUT_OF_STOCK'

  const height = size === 'sm' ? 'h-8' : 'h-9'
  const width = size === 'sm' ? 'w-16' : 'w-20'

  function tryAdd(force = false) {
    try {
      cart.addItem(shop, product, offer, { force })
      if (force) toast.show(`Started a new cart for ${shop.name}`, 'success')
    } catch (e) {
      if (e instanceof CartConflictError) {
        setConflictShop(e.incomingShop)
      } else {
        toast.show('Could not add to cart', 'error')
      }
    }
  }

  return (
    <>
      <div className={cn('inline-flex', className)}>
        {qty === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => tryAdd()}
            className={cn(
              height, width,
              'rounded-full border border-brand-200 bg-brand-50 text-sm font-bold text-brand-700',
              'transition-all active:scale-90 animate-pop-in',
              'hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'disabled:cursor-not-allowed disabled:border-black/5 disabled:bg-gray-100 disabled:text-gray-400',
            )}
          >
            {disabled ? 'Notify' : 'ADD'}
          </button>
        ) : (
          <div
            className={cn(
              height, width,
              'flex animate-pop-in items-center justify-between rounded-full bg-brand text-white shadow-soft',
            )}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => cart.setQuantity(product.id, qty - 1)}
              className="flex h-full flex-1 items-center justify-center active:scale-90 focus-visible:outline-none"
            >
              <IconMinus size={14} />
            </button>
            <span className="min-w-[1.2rem] text-center text-sm font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => tryAdd()}
              className="flex h-full flex-1 items-center justify-center active:scale-90 focus-visible:outline-none"
            >
              <IconPlus size={14} />
            </button>
          </div>
        )}
      </div>

      <Sheet open={!!conflictShop} onClose={() => setConflictShop(null)} title="Start a new cart?">
        <p className="text-sm text-ink/70">
          Your cart has items from <strong>{cart.shop?.name}</strong>. ShopNear reserves at one shop at a
          time — adding this will clear your cart and start a fresh reservation at{' '}
          <strong>{conflictShop?.name}</strong>.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setConflictShop(null)}>Keep current cart</Button>
          <Button
            fullWidth
            onClick={() => {
              tryAdd(true)
              setConflictShop(null)
            }}
          >
            Start new cart
          </Button>
        </div>
      </Sheet>
    </>
  )
}
