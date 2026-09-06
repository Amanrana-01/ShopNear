import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import type { Product, Offer, ShopSummary } from '@shopnear/shared'
import { useCart, CartConflictError } from '@/state/CartContext'
import { useToast } from '@/components/ui/Toast'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface AddToCartControlProps {
  shop: ShopSummary
  product: Product
  offer: Offer
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

const SIZES = {
  sm: { box: 'h-8 min-w-[4.25rem]', text: 'text-xs', icon: 13 },
  md: { box: 'h-9 min-w-[5rem]', text: 'text-sm', icon: 15 },
  lg: { box: 'h-12 min-w-[7rem]', text: 'text-base', icon: 18 },
} as const

/**
 * The signature quick-commerce interaction: an ADD pill that flips in place
 * into a stepper. Reserve semantics rather than "buy now", but the tactile
 * feel — spring on press, the count popping as it changes, the control keeping
 * its footprint so the grid never reflows — should match what people already
 * have muscle memory for.
 */
export function AddToCartControl({
  shop, product, offer, size = 'md', fullWidth, className,
}: AddToCartControlProps) {
  const cart = useCart()
  const toast = useToast()
  const m = useAppMotion()
  const [conflictShop, setConflictShop] = useState<ShopSummary | null>(null)
  const qty = cart.quantityFor(product.id)
  const outOfStock = offer.availability === 'OUT_OF_STOCK'
  const s = SIZES[size]

  function tryAdd(force = false) {
    try {
      cart.addItem(shop, product, offer, { force })
      if (force) toast.show(`Started a new cart at ${shop.name}`, 'success')
    } catch (e) {
      if (e instanceof CartConflictError) setConflictShop(e.incomingShop)
      else toast.show('Could not add to cart', 'error')
    }
  }

  return (
    <>
      <div className={cn('inline-flex', fullWidth && 'w-full', className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {qty === 0 ? (
            <motion.button
              key="add"
              type="button"
              disabled={outOfStock}
              onClick={() => tryAdd()}
              whileTap={outOfStock ? undefined : m.tap}
              initial={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              transition={m.transition}
              className={cn(
                s.box, s.text, fullWidth && 'w-full',
                'rounded-pill border-[1.5px] font-black uppercase tracking-wide',
                'flex items-center justify-center gap-1',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
                outOfStock
                  ? 'cursor-not-allowed border-black/5 bg-canvas-sunken text-ink-faint'
                  : 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100',
              )}
            >
              {outOfStock ? 'Notify' : 'Add'}
              {!outOfStock && <Plus size={s.icon} strokeWidth={3} aria-hidden />}
            </motion.button>
          ) : (
            <motion.div
              key="stepper"
              initial={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={m.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              transition={m.transition}
              className={cn(
                s.box, fullWidth && 'w-full',
                'flex items-center justify-between rounded-pill bg-brand text-white shadow-soft',
              )}
            >
              <button
                type="button"
                aria-label={qty === 1 ? `Remove ${product.name}` : `Decrease ${product.name}`}
                onClick={() => cart.setQuantity(product.id, qty - 1)}
                className="flex h-full flex-1 items-center justify-center rounded-l-pill transition-colors hover:bg-white/10 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
              >
                {qty === 1
                  ? <Trash2 size={s.icon} aria-hidden />
                  : <Minus size={s.icon} strokeWidth={3} aria-hidden />}
              </button>

              <span className="relative min-w-[1.5rem] overflow-hidden text-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={qty}
                    initial={m.reduced ? { opacity: 0 } : { y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={m.reduced ? { opacity: 0 } : { y: -12, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className={cn('block font-black tabular-nums', s.text)}
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </span>

              <button
                type="button"
                aria-label={`Increase ${product.name}`}
                onClick={() => tryAdd()}
                className="flex h-full flex-1 items-center justify-center rounded-r-pill transition-colors hover:bg-white/10 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
              >
                <Plus size={s.icon} strokeWidth={3} aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Sheet
        open={!!conflictShop}
        onClose={() => setConflictShop(null)}
        title="Start a new cart?"
        description="ShopNear reserves at one shop at a time."
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          Your cart has items from <strong className="text-ink">{cart.shop?.name}</strong>. Adding this
          will clear it and start a fresh reservation at{' '}
          <strong className="text-ink">{conflictShop?.name}</strong>.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setConflictShop(null)}>
            Keep current cart
          </Button>
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
