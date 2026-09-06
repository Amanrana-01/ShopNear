import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listShopOrders } from '@/api/client'
import type { Order } from '@/api/types'
import { useShop } from './ShopContext'
import { useToast } from '@/components/ui/Toast'
import { playAlertTone } from '@/lib/alertSound'

interface IncomingOrdersContextValue {
  orders: Order[]
  placedOrders: Order[]
  isLoading: boolean
  error: unknown
  refetch: () => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
}

const IncomingOrdersContext = createContext<IncomingOrdersContextValue | null>(null)

/**
 * Polls this shop's orders every few seconds (Socket.IO is another agent's
 * territory — this app cannot depend on `apps/api` realtime work landing on
 * a particular schedule, so a short poll is the honest, self-contained
 * substitute) and is the single source of truth for "how many reservations
 * are waiting" across the bottom-nav badge and the incoming-reservation
 * screen. Fires a beep + browser Notification the moment a `PLACED` order id
 * appears that wasn't in the previous poll (spec §9: audible alert + browser
 * notification on a new order).
 */
export function IncomingOrdersProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const { show } = useToast()
  const seenIds = useRef<Set<string> | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)
  soundEnabledRef.current = soundEnabled

  const enabled = !!activeShop && activeShop.status === 'ACTIVE'

  const query = useQuery({
    queryKey: ['shop-orders', activeShop?.id],
    queryFn: () => listShopOrders(activeShop!.id),
    enabled,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Reset the "seen" set whenever the active shop changes, so switching
  // shops never fires a false alert for orders that were already there.
  useEffect(() => {
    seenIds.current = null
  }, [activeShop?.id])

  const orders = useMemo(() => query.data ?? [], [query.data])
  const placedOrders = useMemo(
    () => orders.filter((o) => o.status === 'PLACED').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  )

  useEffect(() => {
    if (!query.data) return
    const currentIds = new Set(placedOrders.map((o) => o.id))
    if (seenIds.current === null) {
      // First load after mount/shop-switch — establish the baseline silently.
      seenIds.current = currentIds
      return
    }
    const newOnes = placedOrders.filter((o) => !seenIds.current!.has(o.id))
    seenIds.current = currentIds
    if (newOnes.length > 0) {
      if (soundEnabledRef.current) playAlertTone()
      show(t('incoming.newOrderToast'), 'info')
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(t('incoming.newOrderToast'), {
            body: newOnes.map((o) => t('incoming.orderNumber', { number: o.orderNumber })).join(', '),
          })
        } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data])

  const value: IncomingOrdersContextValue = {
    orders,
    placedOrders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => query.refetch(),
    soundEnabled,
    setSoundEnabled,
  }

  return <IncomingOrdersContext.Provider value={value}>{children}</IncomingOrdersContext.Provider>
}

export function useIncomingOrders() {
  const ctx = useContext(IncomingOrdersContext)
  if (!ctx) throw new Error('useIncomingOrders must be used within IncomingOrdersProvider')
  return ctx
}

export function useIncomingCount(): number {
  const ctx = useContext(IncomingOrdersContext)
  return ctx?.placedOrders.length ?? 0
}
