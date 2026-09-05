import type { Availability } from '@shopnear/shared'
import { cn } from '@/lib/utils'
import { ageInMinutes, formatRelativeTime } from '@/lib/format'
import { IconCheckCircle, IconClock, IconAlert, IconHelp } from './ui/Icon'
import type { IconProps } from './ui/Icon'

export type BadgeTone = 'green' | 'likely' | 'amber' | 'red' | 'grey'

export interface BadgeInfo {
  label: string
  sublabel?: string
  tone: BadgeTone
  Icon: (p: IconProps) => JSX.Element
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-teal-50 text-teal-700',
  likely: 'bg-[#F5FAEC] text-[#3F6212]',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  grey: 'bg-gray-100 text-gray-600',
}

/**
 * The one rule this whole product is built on: never show a number, always
 * show a confidence level paired with how recently it was confirmed. Colour
 * is never the only signal — every tone below ships with its own icon and
 * text label (WCAG "use of colour" 1.4.1).
 */
export function getAvailabilityBadge(
  availability: Availability | null | undefined,
  availabilityUpdatedAt: string | null | undefined,
): BadgeInfo {
  if (!availability || !availabilityUpdatedAt) {
    return { label: 'Ask the shop', sublabel: 'reserving is still allowed', tone: 'grey', Icon: IconHelp }
  }
  const ageMin = ageInMinutes(availabilityUpdatedAt)

  if (availability === 'IN_STOCK') {
    if (ageMin < 120) {
      return { label: 'In stock', sublabel: `confirmed ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'green', Icon: IconCheckCircle }
    }
    if (ageMin < 24 * 60) {
      return { label: 'Likely available', sublabel: `confirmed ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'likely', Icon: IconCheckCircle }
    }
    return { label: 'Usually available', sublabel: 'stock hasn’t been confirmed recently', tone: 'amber', Icon: IconClock }
  }
  if (availability === 'USUALLY_AVAILABLE') {
    return { label: 'Usually available', sublabel: 'this shop normally stocks this', tone: 'amber', Icon: IconClock }
  }
  if (availability === 'OUT_OF_STOCK') {
    if (ageMin < 12 * 60) {
      return { label: 'Out of stock', sublabel: `checked ${formatRelativeTime(availabilityUpdatedAt)}`, tone: 'red', Icon: IconAlert }
    }
    return { label: 'Usually available', sublabel: 'likely restocked since', tone: 'amber', Icon: IconClock }
  }
  return { label: 'Ask the shop', sublabel: 'reserving is still allowed', tone: 'grey', Icon: IconHelp }
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
          'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-none',
          TONE_CLASSES[info.tone], className,
        )}
      >
        <Icon size={12} className="shrink-0" />
        <span className="truncate">{info.label}</span>
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-start gap-2 rounded-2xl px-3 py-2', TONE_CLASSES[info.tone], className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{info.label}</p>
        {info.sublabel && <p className="text-xs leading-tight opacity-80">{info.sublabel}</p>}
      </div>
    </div>
  )
}
