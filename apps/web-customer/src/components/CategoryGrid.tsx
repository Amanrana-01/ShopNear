import { useState, useRef } from 'react'
import type { Category } from '@shopnear/shared'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { categoryPhoto } from '@/lib/photos'
import { itemVariants, listVariants, useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * The "shop by category" block — every top-level category, in two layouts.
 *
 * On a phone the categories are paged: nine per screen in a 3×3 block, and
 * the rest arrive by swiping sideways. Vertical expansion was the earlier
 * approach and it was wrong for this spot — it pushed the shop list an extra
 * four rows down the page for people who only wanted to glance at the
 * aisles. Sideways paging keeps the section a fixed height whatever the
 * catalogue does.
 *
 * From `sm` up there is room to show everything at once, so it becomes a
 * plain grid — sixteen categories fills two complete rows at `lg`.
 *
 * Links use the *top-level* slug; the search endpoint expands that to the
 * whole subtree (see `categorySlugsFor`), which is what makes tapping
 * "Groceries" return the full 40-item aisle instead of nothing.
 */

/** 3×3 — the most that stays tappable on a 360px screen. */
const PER_PAGE = 9

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** A photo on the pale tile that quick-commerce category grids use, falling
 * back to the category glyph only if the image fails to load. */
function CategoryTile({
  category, size, className,
}: { category: Category; size: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = categoryPhoto(category.slug, { w: size })

  return (
    <span className={cn('relative block overflow-hidden bg-[#F0F4FB]', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-brand-400">
          <CategoryIcon iconName={category.iconName} size={Math.round(size * 0.42)} />
        </span>
      )}
    </span>
  )
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/search?category=${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-tile bg-white shadow-tile transition-shadow hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <CategoryTile
        category={category}
        size={160}
        className="aspect-[4/3] w-full transition-transform duration-200 group-hover:scale-[1.03]"
      />
      <span className="line-clamp-2 px-2 py-2 text-center text-[11.5px] font-bold leading-tight text-ink">
        {category.name}
      </span>
    </Link>
  )
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const m = useAppMotion()
  const topLevel = categories.filter((c) => !c.parentId)
  const pages = chunk(topLevel, PER_PAGE)
  const [page, setPage] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  /** Derive the active dot from scroll position rather than tracking it —
   * the page can change by swipe or by tapping a dot, and this stays correct
   * for both without the two fighting each other. */
  function onScroll() {
    const el = scroller.current
    if (!el) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== page) setPage(next)
  }

  function goTo(i: number) {
    const el = scroller.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: m.reduced ? 'auto' : 'smooth' })
  }

  return (
    <>
      {/* Phone: paged, swiped sideways. */}
      <div className="sm:hidden">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label="Shop by category"
        >
          {pages.map((group, i) => (
            <motion.div
              key={i}
              variants={m.variants(listVariants)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              // `w-full` resolves to the scroller's own width, so a page is
              // always exactly one screenful. Sizing it from `100vw` looked
              // right on a bare phone but broke inside the max-w-lg app
              // column: pages were wider than their container, which clipped
              // the first column and leaked the next page in at the edge.
              // The horizontal padding lives here rather than on the scroller
              // so it is inside the snap area and every page aligns with the
              // rest of the feed.
              className="grid w-full shrink-0 snap-start grid-cols-3 content-start gap-2.5 px-4"
            >
              {group.map((cat) => (
                <motion.div key={cat.id} variants={m.variants(itemVariants)}>
                  <CategoryCard category={cat} />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        {pages.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Category page ${i + 1} of ${pages.length}`}
                aria-current={i === page}
                className="p-1.5 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-300',
                    i === page ? 'w-5 bg-brand' : 'w-1.5 bg-brand-200',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tablet and up: everything at once. */}
      <motion.div
        variants={m.variants(listVariants)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -60px 0px' }}
        className="hidden gap-2.5 px-4 sm:grid sm:grid-cols-4 lg:grid-cols-8 lg:px-0"
      >
        {topLevel.map((cat) => (
          <motion.div key={cat.id} variants={m.variants(itemVariants)}>
            <CategoryCard category={cat} />
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}
