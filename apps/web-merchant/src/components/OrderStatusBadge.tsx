import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { IconCheckCircle, IconClock, IconAlert, IconTruck, IconPackage, IconX, IconHelp } from './ui/Icon'
import type { OrderStatus } from '@/api/types'

const TONE: Record<OrderStatus, { cls: string; Icon: typeof IconCheckCircle }> = {
  PLACED: { cls: 'bg-amber-50 text-amber-700', Icon: IconClock },
  CONFIRMED: { cls: 'bg-teal-50 text-teal-700', Icon: IconCheckCircle },
  READY_FOR_PICKUP: { cls: 'bg-teal-50 text-teal-700', Icon: IconPackage },
  OUT_FOR_DELIVERY: { cls: 'bg-brand-50 text-brand-700', Icon: IconTruck },
  COMPLETED: { cls: 'bg-gray-100 text-gray-600', Icon: IconCheckCircle },
  CANCELLED_BY_CUSTOMER: { cls: 'bg-gray-100 text-gray-500', Icon: IconX },
  REJECTED_BY_SHOP: { cls: 'bg-rose-50 text-rose-700', Icon: IconX },
  EXPIRED: { cls: 'bg-gray-100 text-gray-500', Icon: IconHelp },
}

/** Never colour alone (spec §13): every tone pairs an icon with a translated
 * text label. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { t } = useTranslation()
  const { cls, Icon } = TONE[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cls, className)}>
      <Icon size={13} />
      {t(`orderStatus.${status}`)}
    </span>
  )
}
