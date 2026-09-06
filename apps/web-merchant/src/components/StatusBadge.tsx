import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { IconCheckCircle, IconClock, IconAlert } from './ui/Icon'
import type { ShopStatus } from '@/api/types'

/** Shop status badge — colour + icon + text, never colour alone (spec §13). */
export function ShopStatusBadge({ status, className }: { status: ShopStatus; className?: string }) {
  const { t } = useTranslation()
  const map = {
    ACTIVE: { label: t('shopSwitcher.active'), cls: 'bg-teal-50 text-teal-700', Icon: IconCheckCircle },
    PENDING: { label: t('shopSwitcher.pending'), cls: 'bg-amber-50 text-amber-700', Icon: IconClock },
    SUSPENDED: { label: t('shopSwitcher.suspended'), cls: 'bg-rose-50 text-rose-700', Icon: IconAlert },
  } as const
  const info = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold', info.cls, className)}>
      <info.Icon size={12} />
      {info.label}
    </span>
  )
}
