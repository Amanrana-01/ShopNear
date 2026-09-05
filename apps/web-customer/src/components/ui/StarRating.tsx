import { IconStar } from './Icon'
import { cn } from '@/lib/utils'

export function StarRating({
  value, onChange, size = 18, readOnly, label = 'Rating',
}: { value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean; label?: string }) {
  return (
    <div role={readOnly ? 'img' : 'radiogroup'} aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={value >= n}
          onClick={() => onChange?.(n)}
          className={cn(
            'transition-transform',
            !readOnly && 'active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded',
            readOnly && 'cursor-default',
          )}
        >
          <IconStar size={size} filled={value >= n} className={value >= n ? 'text-amber-500' : 'text-black/15'} />
        </button>
      ))}
    </div>
  )
}

export function RatingDisplay({ rating, count, size = 12 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/80">
      <IconStar size={size} filled className="text-amber-500" />
      {rating.toFixed(1)}
      {typeof count === 'number' && <span className="font-normal text-ink/40">({count})</span>}
    </span>
  )
}
