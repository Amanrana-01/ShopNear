import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

/**
 * Sticky header for every screen that isn't the feed. On desktop the back
 * button stays (it is still the fastest way out of a detail page) but the bar
 * loses its sticky chrome, since DesktopHeader already occupies the top.
 */
export function PageHeader({
  title, subtitle, right, onBack,
}: { title: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-1.5 border-b border-black/5 bg-white/95 px-2 pb-2.5 pt-[calc(0.6rem+env(safe-area-inset-top))] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-4 lg:pt-6 lg:backdrop-blur-none">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        aria-label="Go back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <ChevronLeft size={22} aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[17px] font-extrabold tracking-tight text-ink lg:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
