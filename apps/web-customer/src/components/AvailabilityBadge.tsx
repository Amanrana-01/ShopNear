import type { Availability, Badge, BadgeTone as ApiBadgeTone } from '@shopnear/shared'
import { cn } from '@/lib/utils'
import { ageInMinutes, formatRelativeTime } from '@/lib/format'
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type BadgeTone = 'green' | 'likely' | 'amber' | 'red' | 'grey'

export interface BadgeInfo {
  label: string
  sublabel?: string
  tone: BadgeTone
  Icon: LucideIcon
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-success-50 text-success-700',
  likely: 'bg-[#F5FAEC] text-[#3F6212]',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  grey: 'bg-canvas-sunken text-ink-muted',
}

/** Maps the API's server-computed badge tone (`green-amber` etc.) onto this
 * component's own tone/icon vocabulary. Used only when a precomputed
 * `badge` is supplied — see `getAvailabilityBadge` below. */
const API_TONE_TO_LOCAL: Record<ApiBadgeTone, { tone: BadgeTone; Icon: LucideIcon }> = {
  green: { tone: 'green', Icon: CheckCircle2 },
  'green-amber': { tone: 'likely', Icon: CheckCircle2 },
  amber: { tone: 'amber', Icon: Clock },
  red: { tone: 'red', Icon: AlertCircle },
  grey: { tone: 'grey', Icon: HelpCircle },
}

/**
 * The one rule this whole product is built on: never show a number, always
 * show a confidence level paired with how recently it was confirmed. Colour
 * is never the only signal — every tone below ships with its own icon and
 * text label (WCAG "use of colour" 1.4.1).
 *
 * `precomputed`, when given, is the API's own server-computed badge (single
 * item search never exposes the raw availability/timestamp pair, only this
 * — see contracts.ts's `Offer.badge`) and is rendered as-is instead of
 * re-derived from `availability`/`availabilityUpdatedAt`.
 */
export function getAvailabilityBadge(
  availability: Availability | null | undefined,
  availabilityUpdatedAt: string | null | undefined,
  precomputed?: Badge,
): BadgeInfo {
  if (precomputed) {
    const mapped = API_TONE_TO_LOCAL[precomputed.tone]
    return { label: precomputed.label, sublabel: precomputed.detail, tone: mapped.tone, Icon: mapped.Icon }
  }
  if (!availability || !availabilityUpdatedAt) {
    return { label: 'Ask the shop', sublabel: 'reserving is still allowed', tone: 'grey', Icon: HelpCircle }
  }
  const ageMin = ageInMinutes(availabilityUpdatedAt)

  if (availability === 'IN_STOCK') {
    if (ageMin < 120) {
      return { label: 'In stock', sublabel: `confirmed ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'green', Icon: CheckCircle2 }
    }
    if (ageMin < 24 * 60) {
      return { label: 'Likely available', sublabel: `confirmed ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'likely', Icon: CheckCircle2 }
    }
    return { label: 'Usually available', sublabel: 'stock hasn’t been confirmed recently', tone: 'amber', Icon: Clock }
  }
  if (availability === 'USUALLY_AVAILABLE') {
    return { label: 'Usually available', sublabel: 'this shop normally stocks this', tone: 'amber', Icon: Clock }
  }
  if (availability === 'OUT_OF_STOCK') {
    if (ageMin < 12 * 60) {
      return { label: 'Out of stock', sublabel: `checked ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'red', Icon: AlertCircle }
    }
    return { label: 'Usually available', sublabel: 'likely restocked since', tone: 'amber', Icon: Clock }
  }
  return { label: 'Ask the shop', sublabel: 'reserving is still allowed', tone: 'grey', Icon: HelpCircle }
}

interface AvailabilityBadgeProps {
  availability: Availability | null | undefined
  availabilityUpdatedAt: string | null | undefined
  size?: 'compact' | 'full'
  className?: string
}

export function AvailabilityBadge({ availability, availabilityUpdatedAt, size = 'full', className }: AvailabilityBadgeProps) {
  const info = getAvailabilityBadge(availability, availabilityUpdatedAt)
  const { Icon } = info

  if (size === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-bold leading-none',
          TONE_CLASSES[info.tone], className,
        )}
      >
        <Icon size={11} strokeWidth={2.5} className="shrink-0" aria-hidden />
        <span className="truncate">{info.label}</span>
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-start gap-2 rounded-2xl px-3 py-2', TONE_CLASSES[info.tone], className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{info.label}</p>
        {info.sublabel && <p className="text-xs leading-tight opacity-80">{info.sublabel}</p>}
      </div>
    </div>
  )
}
