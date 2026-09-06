import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { ProductSearchGroup } from '@shopnear/shared'
import { ProductCard } from './ProductCard'
import { listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ProductRailProps {
  title: string
  subtitle?: string
  groups: ProductSearchGroup[]
  seeAllTo?: string
  className?: string
}

/**
 * Horizontal product shelf — the unit a quick-commerce home page is built
 * from. Each rail is one merchandising idea ("Fresh vegetables", "Under ₹50")
 * with its own "see all", so the home page stays browsable without a single
 * endless grid.
 *
 * Tiles snap on scroll and the rail is deliberately not full-bleed at the
 * right edge: a sliver of the next tile is the affordance that says "there is
 * more this way", which is more reliable than an arrow on touch.
 */
export function ProductRail({ title, subtitle, groups, seeAllTo, className }: ProductRailProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const m = useAppMotion()

  if (groups.length === 0) return null

  function nudge(direction: 1 | -1) {
    scroller.current?.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  return (
    <section className={cn('py-1', className)}>
      <div className="mb-2.5 flex items-end justify-between gap-3 px-4 lg:px-0">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-extrabold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Arrows are a desktop convenience only; touch users flick. */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => nudge(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white text-ink-muted transition-colors hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronLeft size={17} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => nudge(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white text-ink-muted transition-colors hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronRight size={17} aria-hidden />
            </button>
          </div>

          {seeAllTo && (
            <Link
              to={seeAllTo}
              className="flex items-center gap-0.5 rounded-pill px-2 py-1 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              See all
              <ChevronRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <motion.div
        ref={scroller}
        variants={m.variants(listVariants)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        className="no-scrollbar snap-rail flex gap-2.5 overflow-x-auto scroll-smooth px-4 pb-1 lg:px-0"
      >
        {groups.map((group) => (
          <div key={group.product.id} className="w-[9.5rem] shrink-0 sm:w-[10.5rem]">
            <ProductCard
              product={group.product}
              offer={group.offers[0]}
              shop={group.offers[0].shop}
              shopCount={group.offers.length}
              className="h-full"
            />
          </div>
        ))}
      </motion.div>
    </section>
  )
}
