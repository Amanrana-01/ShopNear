import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useShop } from '@/state/ShopContext'
import { useAuth } from '@/state/AuthContext'
import { useIncomingOrders } from '@/state/IncomingCountContext'
import { getAllShopInventory } from '@/api/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import { formatRupees } from '@/lib/format'
import { IconBell, IconPackage, IconClipboard, IconStore, IconAlert, IconCheckCircle, IconX } from '@/components/ui/Icon'

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

const ACCEPTED_LIKE = new Set(['CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'])
const VALUE_COUNTED = new Set(['PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'])

export default function Dashboard() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { orders, placedOrders, isLoading, error, refetch } = useIncomingOrders()

  const inventoryQuery = useQuery({
    queryKey: ['shop-inventory-all', activeShop?.id],
    queryFn: () => getAllShopInventory(activeShop!.id),
    enabled: !!activeShop,
    staleTime: 30_000,
  })

  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt))
    const received = today.length
    const confirmed = today.filter((o) => ACCEPTED_LIKE.has(o.status)).length
    const rejected = today.filter((o) => o.status === 'REJECTED_BY_SHOP').length
    const estimatedValue = today.filter((o) => VALUE_COUNTED.has(o.status)).reduce((sum, o) => sum + o.total, 0)
    return { received, confirmed, rejected, estimatedValue }
  }, [orders])

  const topUnavailable = useMemo(() => {
    const items = inventoryQuery.data ?? []
    const withRejects = items.filter((i) => i.rejectCount > 0).sort((a, b) => b.rejectCount - a.rejectCount)
    return withRejects[0] ?? null
  }, [inventoryQuery.data])

  if (!activeShop) return null

  if (isLoading) {
    return (
      <div className="px-4 py-5">
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (error) {
    return <ErrorState title={t('common.somethingWrong')} description={t('common.networkError')} onRetry={refetch} retryLabel={t('common.retry')} />
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 animate-fade-in-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('dashboard.title')}</h1>
        <p className="text-sm text-ink/55">{t('dashboard.welcomeBack', { name: user?.name })}</p>
      </div>

      {placedOrders.length > 0 && (
        <button
          type="button"
          onClick={() => navigate('/orders/incoming')}
          className="flex items-center justify-between rounded-card bg-amber-50 p-4 text-left shadow-soft animate-pulse-ring"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <IconBell size={20} />
            </div>
            <p className="font-semibold text-amber-800">{t('dashboard.pendingBadge', { count: placedOrders.length })}</p>
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate('/orders/incoming') }}>
            {t('dashboard.goToIncoming')}
          </Button>
        </button>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 p-4">
          <IconPackage size={20} className="text-brand-500" />
          <p className="text-2xl font-bold text-ink">{stats.received}</p>
          <p className="text-center text-xs font-medium text-ink/55">{t('dashboard.received')}</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-4">
          <IconCheckCircle size={20} className="text-teal-600" />
          <p className="text-2xl font-bold text-ink">{stats.confirmed}</p>
          <p className="text-center text-xs font-medium text-ink/55">{t('dashboard.confirmed')}</p>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-4">
          <IconX size={20} className="text-rose-500" />
          <p className="text-2xl font-bold text-ink">{stats.rejected}</p>
          <p className="text-center text-xs font-medium text-ink/55">{t('dashboard.rejected')}</p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-medium text-ink/55">{t('dashboard.estimatedValue')}</p>
        <p className="font-display text-3xl font-bold text-brand-700">{formatRupees(stats.estimatedValue)}</p>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-ink/70">{t('dashboard.topUnavailableTitle')}</p>
        {topUnavailable ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <IconAlert size={18} />
            </div>
            <p className="text-sm text-ink/80">
              {t('dashboard.topUnavailableItem', { name: topUnavailable.product.name, count: topUnavailable.rejectCount })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink/55">{t('dashboard.noTopItem')}</p>
        )}
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink/70">{t('dashboard.quickActions')}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="flex flex-col items-center gap-2 rounded-card bg-white p-4 shadow-soft active:scale-[0.98]"
          >
            <IconPackage size={22} className="text-brand-500" />
            <span className="text-sm font-semibold text-ink">{t('dashboard.manageStock')}</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex flex-col items-center gap-2 rounded-card bg-white p-4 shadow-soft active:scale-[0.98]"
          >
            <IconClipboard size={22} className="text-brand-500" />
            <span className="text-sm font-semibold text-ink">{t('dashboard.viewHistory')}</span>
          </button>
          <button
            onClick={() => navigate('/shop/profile')}
            className="col-span-2 flex flex-col items-center gap-2 rounded-card bg-white p-4 shadow-soft active:scale-[0.98]"
          >
            <IconStore size={22} className="text-brand-500" />
            <span className="text-sm font-semibold text-ink">{t('dashboard.shopProfile')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
