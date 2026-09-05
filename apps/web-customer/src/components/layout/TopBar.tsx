import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation as useRouterLocation } from 'react-router-dom'
import { IconChevronDown, IconSearch } from '@/components/ui/Icon'
import { useLocation } from '@/state/LocationContext'
import { LocationSheet } from '@/components/LocationSheet'

const HINTS = ['Search "atta"', 'Search "doodh"', 'Search "Maggi"', 'Search "sabun"', 'Search "notebook"']

/** Sticky Blinkit-style header: location line with a chevron to change it,
 * and directly beneath it, always-visible search — the two things this app
 * needs you to see before anything else. */
export function TopBar() {
  const { location } = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const routerLocation = useRouterLocation()

  useEffect(() => {
    const id = setInterval(() => setHintIndex((i) => (i + 1) % HINTS.length), 2600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search)
    setQuery(params.get('q') ?? '')
  }, [routerLocation.search])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
  }

  return (
    <header className="sticky top-0 z-30 bg-brand pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-soft">
      <div className="mx-auto flex max-w-lg flex-col gap-2.5 px-4">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1 self-start rounded-lg py-0.5 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <span className="max-w-[240px] truncate text-[15px] font-bold">{location?.label ?? 'Choose location'}</span>
          <IconChevronDown size={16} />
        </button>
        {location?.sublabel && <p className="-mt-2 truncate text-xs text-white/75">{location.sublabel}</p>}

        <form onSubmit={submitSearch} className="relative">
          <IconSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={HINTS[hintIndex]}
            aria-label="Search for products or shops"
            className="w-full rounded-full border-0 bg-white py-3 pl-11 pr-4 text-[15px] text-ink shadow-soft placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </form>
      </div>
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </header>
  )
}
