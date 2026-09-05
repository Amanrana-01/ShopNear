import type { RadiusMeters } from '@shopnear/shared'
import { cn } from '@/lib/utils'

const OPTIONS: { value: RadiusMeters; label: string }[] = [
  { value: 250, label: '250 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
]

export function RadiusControl({ value, onChange }: { value: RadiusMeters; onChange: (v: RadiusMeters) => void }) {
  return (
    <div role="radiogroup" aria-label="Search radius" className="inline-flex rounded-full bg-brand-50 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            value === opt.value ? 'bg-brand text-white shadow-soft' : 'text-brand-700/70 hover:text-brand-700',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
