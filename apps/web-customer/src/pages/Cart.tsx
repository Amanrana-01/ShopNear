import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus, Trash2, ShoppingBag, Store, ShieldCheck } from 'lucide-react'
import { useCart } from '@/state/CartContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { AvailabilityBadge } from '@/components/AvailabilityBadge'
import { ProductImage } from '@/components/ui/ProductImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRupees, pluralize } from '@/lib/format'
import { shopMeta, walkMinutes, formatMinutes } from '@/lib/shopMeta'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export default function Cart() {
  const cart = useCart()
  const navigate = useNavigate()
  const m = useAppMotion()

  if (cart.items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState
          icon={<ShoppingBag size={26} aria-hidden />}
          title="Your cart is empty"
          description="Find something nearby and reserve it — then collect and pay at the shop."
          action={{ label: 'Start shopping', onClick: () => navigate('/home') }}
        />
      </div>
    )
  }

  const meta = shopMeta(cart.shop?.type)

  return (
    <div className="pb-32 lg:pb-12">
      <PageHeader title="Cart" subtitle={`${cart.itemCount} ${pluralize(cart.itemCount, 'item')}`} />

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-card bg-white p-3 shadow-tile lg:mx-0">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', meta.tile)}>
              <meta.Icon size={20} strokeWidth={1.7} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{cart.shop?.name}</p>
              <p className="text-xs text-ink-muted">
                {cart.shop
                  ? `${formatMinutes(walkMinutes(cart.shop.distanceMeters))} walk · everything here is reserved at this one shop`
                  : 'Everything in one cart is reserved at a single shop'}
              </p>
            </div>
          </div>

          <motion.ul
            variants={m.variants(listVariants)}
            initial="hidden"
            animate="show"
            className="mx-4 mt-2.5 flex flex-col gap-2.5 lg:mx-0"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {cart.items.map((item) => (
                <motion.li
                  key={item.product.id}
                  layout
                  variants={m.variants(itemVariants)}
                  exit={m.reduced ? { opacity: 0 } : { opacity: 0, x: -24, height: 0, marginTop: 0 }}
                  transition={m.transition}
                  className="flex gap-3 rounded-card bg-white p-3 shadow-tile"
                >
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage product={item.product} size="sm" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-ink">
                      {item.product.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{item.product.defaultUnitLabel}</p>
                    <AvailabilityBadge
                      availability={item.availability}
                      availabilityUpdatedAt={item.availabilityUpdatedAt}
                      size="compact"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                    <button
                      type="button"
                      aria-label={`Remove ${item.product.name}`}
                      onClick={() => cart.removeItem(item.product.id)}
                      className="rounded p-1 text-ink-faint transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>

                    <div className="flex h-8 items-center rounded-pill bg-brand-50">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.product.name}`}
                        onClick={() => cart.setQuantity(item.product.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-l-pill text-brand-700 transition-colors hover:bg-brand-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                      >
                        <Minus size={13} strokeWidth={3} aria-hidden />
                      </button>
                      <span className="min-w-[1.25rem] text-center text-[13px] font-black tabular-nums text-brand-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.product.name}`}
                        onClick={() => cart.setQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-r-pill text-brand-700 transition-colors hover:bg-brand-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                      >
                        <Plus size={13} strokeWidth={3} aria-hidden />
                      </button>
                    </div>

                    <span className="text-sm font-black text-ink">
                      {formatRupees(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>

        <aside className="lg:sticky lg:top-[5.5rem]">
          <div className="mx-4 mt-3 rounded-card bg-white p-4 shadow-tile lg:mx-0 lg:mt-3">
            <h2 className="mb-2.5 font-display text-sm font-extrabold tracking-tight text-ink">
              Bill summary
            </h2>
            <dl className="flex flex-col gap-1.5 text-[13px]">
              <div className="flex justify-between text-ink-muted">
                <dt>
                  Item total ({cart.itemCount} {pluralize(cart.itemCount, 'item')})
                </dt>
                <dd className="font-semibold text-ink">{formatRupees(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Delivery</dt>
                <dd className="text-ink-faint">Chosen at checkout</dd>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-black/5 pt-2.5 text-[15px]">
                <dt className="font-bold text-ink">To pay</dt>
                <dd className="font-black text-ink">{formatRupees(cart.subtotal)}</dd>
              </div>
            </dl>

            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-success-50 px-2.5 py-2 text-[11.5px] leading-snug text-success-700">
              <ShieldCheck size={14} className="mt-px shrink-0" aria-hidden />
              You pay at the shop. Nothing is charged now — the reservation just holds your items.
            </p>

            <Button
              fullWidth
              size="lg"
              className="mt-3 hidden lg:inline-flex"
              onClick={() => navigate('/checkout')}
            >
              Proceed to reserve
            </Button>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/shop/${cart.shop?.id}`)}
            className="mx-4 mt-2.5 flex w-[calc(100%-2rem)] items-center gap-2 rounded-card border border-dashed border-brand-200 px-4 py-3 text-left text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:mx-0 lg:w-full"
          >
            <Store size={16} aria-hidden />
            Add more from {cart.shop?.name}
          </button>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto max-w-lg px-4 lg:hidden">
        <Button fullWidth size="lg" onClick={() => navigate('/checkout')} className="shadow-lift">
          Proceed to reserve · {formatRupees(cart.subtotal)}
        </Button>
      </div>
    </div>
  )
}
