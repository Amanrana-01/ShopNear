import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { IconChevronLeft } from '@/components/ui/Icon'

export function PageHeader({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-white/95 px-2 pb-2.5 pt-[calc(0.6rem+env(safe-area-inset-top))] shadow-soft backdrop-blur">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        aria-label="Go back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <IconChevronLeft size={22} />
      </button>
      <h1 className="flex-1 truncate font-display text-[17px] font-semibold text-ink">{title}</h1>
      {right}
    </header>
  )
}
