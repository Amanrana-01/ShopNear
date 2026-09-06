import { cn } from '@/lib/utils'
import { IconAlert, IconCheckCircle, IconClock, IconFlag, IconHelp, IconX, type IconProps } from './ui/Icon'
import type { ShopStatus, OrderStatus, DisputeStatus, Badge as ApiBadge, BadgeTone } from '@/types'

/**
 * Cross-cutting accessibility requirement: status is never colour alone —
 * every badge below pairs a colour with an icon AND a text label (WCAG
 * 1.4.1, "use of colour").
 */
export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'teal' | 'brand'

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  grey: 'bg-gray-100 text-gray-600',
  teal: 'bg-teal-50 text-teal-700',
  brand: 'bg-brand-50 text-brand-700',
}

export function StatusPill({ tone, label, Icon, className }: { tone: Tone; label: string; Icon: (p: IconProps) => JSX.Element; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none', TONE_CLASSES[tone], className)}>
      <Icon size={13} className="shrink-0" />
      <span>{label}</span>
    </span>
  )
}

export function ShopStatusBadge({ status }: { status: ShopStatus }) {
  if (status === 'ACTIVE') return <StatusPill tone="green" label="Active" Icon={IconCheckCircle} />
  if (status === 'PENDING') return <StatusPill tone="amber" label="Pending approval" Icon={IconClock} />
  return <StatusPill tone="red" label="Suspended" Icon={IconX} />
}

const ORDER_STATUS_TONE: Record<OrderStatus, { tone: Tone; label: string; Icon: (p: IconProps) => JSX.Element }> = {
  PLACED: { tone: 'amber', label: 'Placed', Icon: IconClock },
  CONFIRMED: { tone: 'brand', label: 'Confirmed', Icon: IconCheckCircle },
  READY_FOR_PICKUP: { tone: 'teal', label: 'Ready for pickup', Icon: IconCheckCircle },
  OUT_FOR_DELIVERY: { tone: 'teal', label: 'Out for delivery', Icon: IconCheckCircle },
  COMPLETED: { tone: 'green', label: 'Completed', Icon: IconCheckCircle },
  CANCELLED_BY_CUSTOMER: { tone: 'grey', label: 'Cancelled', Icon: IconX },
  REJECTED_BY_SHOP: { tone: 'red', label: 'Rejected by shop', Icon: IconAlert },
  EXPIRED: { tone: 'grey', label: 'Expired', Icon: IconClock },
}
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const info = ORDER_STATUS_TONE[status]
  return <StatusPill tone={info.tone} label={info.label} Icon={info.Icon} />
}

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  if (status === 'OPEN') return <StatusPill tone="amber" label="Open" Icon={IconFlag} />
  if (status === 'RESOLVED') return <StatusPill tone="green" label="Resolved" Icon={IconCheckCircle} />
  return <StatusPill tone="grey" label="Rejected" Icon={IconX} />
}

const API_TONE_TO_ICON: Record<BadgeTone, (p: IconProps) => JSX.Element> = {
  green: IconCheckCircle,
  'green-amber': IconCheckCircle,
  amber: IconClock,
  red: IconAlert,
  grey: IconHelp,
}
const API_TONE_TO_PILL: Record<BadgeTone, Tone> = {
  green: 'green', 'green-amber': 'teal', amber: 'amber', red: 'red', grey: 'grey',
}
/** Renders the API's own server-computed availability confidence badge
 * as-is — never re-derived, never a numeric stock count. */
export function AvailabilityBadgePill({ badge }: { badge: ApiBadge }) {
  return <StatusPill tone={API_TONE_TO_PILL[badge.tone]} label={badge.label} Icon={API_TONE_TO_ICON[badge.tone]} />
}
