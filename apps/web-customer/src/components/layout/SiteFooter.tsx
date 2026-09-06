import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Logo } from '@/components/ui/Logo'

/** Routes worth a second entry point once someone has scrolled this far. */
const EXPLORE: { to: string; label: string }[] = [
  { to: '/home', label: 'Home' },
  { to: '/multi-search', label: 'List search' },
  { to: '/orders', label: 'Your orders' },
  { to: '/cart', label: 'Cart' },
  { to: '/account', label: 'Account' },
  { to: '/story', label: 'The story' },
]

/** The people who built this. */
const CONTRIBUTORS = ['Aman Rana', 'Saksham Bhardwaj', 'Vagisha Purohit', 'Harshad']

/**
 * The page's full stop.
 *
 * A quick-commerce home page ends in a sitemap of aisles for a reason: the
 * grid above shows the categories as pictures you swipe, this shows all of
 * them as text you can scan and a crawler can follow. Deep brand purple so
 * the feed visibly ends here rather than trailing off into empty canvas —
 * the same job the discovery band does at the top of Home.
 */
export function SiteFooter() {
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories() })
  const topLevel = (categoriesQuery.data ?? []).filter((c) => !c.parentId)

  return (
    <footer className="mt-10 bg-brand-900 text-white/70">
      <div className="mx-auto w-full max-w-lg px-4 py-9 lg:max-w-app lg:px-6 lg:py-12">
        <div className="grid gap-9 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
          <div>
            <Logo size={34} tone="onDark" />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/60">
              One list, one shop. Everything your neighbourhood kirana already stocks —
              found by distance, not by warehouse.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <div>
              <h2 className="font-display text-sm font-extrabold tracking-tight text-white">
                All categories
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
                {topLevel.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/search?category=${cat.slug}`}
                      className="block truncate rounded text-[13px] text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-sm font-extrabold tracking-tight text-white">
                Explore
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-1">
                {EXPLORE.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="block rounded text-[13px] text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Credits. The bottom padding also clears the fixed bottom nav and the
          floating cart bar, which is why it lives here and not on the page
          container above. */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-4 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 lg:max-w-app lg:px-6 lg:pb-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wide text-white/40">
              Built by
            </span>
            {CONTRIBUTORS.map((name) => (
              <span
                key={name}
                className="rounded-pill bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-white"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-[11.5px] text-white/40">
            © {new Date().getFullYear()} ShopNear
          </p>
        </div>
      </div>
    </footer>
  )
}
