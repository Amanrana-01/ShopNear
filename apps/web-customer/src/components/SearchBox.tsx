import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

const HINTS = ['atta', 'doodh', 'Maggi', 'sabun', 'notebook', 'paneer', 'chai']

/**
 * The app's single search entry point, shared by the mobile top bar and the
 * desktop header.
 *
 * The placeholder cycles through real product terms rather than sitting on a
 * generic "Search…" — in a hyperlocal catalogue the useful information is
 * *what kind of thing* you can ask for, and Hindi/Gujarati transliterations
 * ("doodh", "sabun") are the fastest way to say "type it how you say it".
 */
export function SearchBox({
  size = 'md', autoFocus, className,
}: { size?: 'md' | 'lg'; autoFocus?: boolean; className?: string }) {
  const navigate = useNavigate()
  const routerLocation = useRouterLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hintIndex, setHintIndex] = useState(0)
  const [focused, setFocused] = useState(false)
  const m = useAppMotion()

  useEffect(() => {
    if (focused || query) return
    const id = setInterval(() => setHintIndex((i) => (i + 1) % HINTS.length), 2400)
    return () => clearInterval(id)
  }, [focused, query])

  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search)
    setQuery(params.get('q') ?? '')
  }, [routerLocation.search])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
  }

  const showHint = !focused && !query

  return (
    <form onSubmit={submit} role="search" className={cn('relative w-full', className)}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        enterKeyHint="search"
        aria-label="Search for products"
        placeholder={showHint ? '' : 'Search for products'}
        className={cn(
          'w-full rounded-pill border border-transparent bg-white text-ink shadow-tile',
          'pl-11 pr-10 transition-shadow duration-150',
          'placeholder:text-ink-faint',
          'focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200',
          size === 'lg' ? 'py-3.5 text-[15px]' : 'py-3 text-[15px]',
        )}
      />

      {/* Animated placeholder. Sits behind the input's own (empty) placeholder
          and is hidden from assistive tech — the input carries a real label. */}
      {showHint && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-11 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[15px] text-ink-faint"
        >
          Search for
          <span className="relative inline-block h-5 w-24 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={HINTS[hintIndex]}
                initial={m.reduced ? { opacity: 0 } : { y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={m.reduced ? { opacity: 0 } : { y: -18, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 font-semibold text-brand-500"
              >
                “{HINTS[hintIndex]}”
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      )}

      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X size={16} />
        </button>
      )}
    </form>
  )
}
