import { Radar } from 'lucide-react'
import type { RadiusMeters } from '@shopnear/shared'
import { SelectMenu } from '@/components/ui/SelectMenu'

interface Option {
  value: RadiusMeters
  label: string
  /** What the distance actually means on foot or on a scooter — the number
   * alone doesn't tell you whether it's still "nearby". */
  hint: string
}

const OPTIONS: Option[] = [
  { value: 250, label: '250 m', hint: '2–4 min walk' },
  { value: 500, label: '500 m', hint: '5–7 min walk' },
  { value: 1000, label: '1 km', hint: '10–12 min walk' },
  { value: 3000, label: '3 km', hint: 'short auto ride' },
  { value: 10000, label: '10 km', hint: 'across the area' },
  { value: 25000, label: '25 km', hint: 'the whole city' },
]

/** The next rung up, or null at the top. Used by empty states so "widen the
 * search" always actually widens it — offering "Search 3 km" to someone
 * already on 3 km was a no-op button. */
export function nextRadiusUp(current: RadiusMeters): RadiusMeters | null {
  const i = OPTIONS.findIndex((o) => o.value === current)
  return i >= 0 && i < OPTIONS.length - 1 ? OPTIONS[i + 1].value : null
}

export function formatRadius(value: RadiusMeters): string {
  return OPTIONS.find((o) => o.value === value)?.label ?? `${value} m`
}

/**
 * Search radius picker — the distance half of the filter row, built on the
 * shared `SelectMenu`. The options carry a second line ("10–12 min walk")
 * because the number on its own doesn't answer the question people are
 * actually asking.
 */
export function RadiusControl({
  value, onChange, className,
}: { value: RadiusMeters; onChange: (v: RadiusMeters) => void; className?: string }) {
  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]

  return (
    <SelectMenu<RadiusMeters>
      value={selected.value}
      onChange={onChange}
      options={OPTIONS.map((o) => ({ value: o.value, label: `Within ${o.label}`, hint: o.hint }))}
      triggerLabel={selected.label}
      triggerIcon={<Radar size={14} className="text-brand-600" aria-hidden />}
      triggerAriaLabel={`Search radius: within ${selected.label}`}
      menuLabel="Search radius"
      className={className}
    />
  )
}
