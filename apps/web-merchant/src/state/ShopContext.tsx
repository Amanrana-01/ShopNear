import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Shop } from '@/api/types'
import { useAuth } from './AuthContext'
import { loadJSON, saveJSON } from '@/lib/storage'

/**
 * A merchant may own more than one shop (spec: two seeded merchants do —
 * `GET /api/auth/me` always returns `shops` as an array, never a single
 * object). Every business screen reads the "active" shop from here rather
 * than assuming `user.shops[0]`, and the header's shop switcher is what
 * changes it.
 */
interface ShopContextValue {
  shops: Shop[]
  activeShop: Shop | null
  activeShopId: string | null
  setActiveShopId: (id: string) => void
  refreshShops: (shops: Shop[]) => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

const ACTIVE_SHOP_KEY = 'activeShopId'

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const shops = useMemo(() => user?.shops ?? [], [user])
  const [activeShopId, setActiveShopIdState] = useState<string | null>(() => loadJSON<string | null>(ACTIVE_SHOP_KEY, null))

  useEffect(() => {
    if (shops.length === 0) return
    if (!activeShopId || !shops.some((s) => s.id === activeShopId)) {
      setActiveShopIdState(shops[0].id)
      saveJSON(ACTIVE_SHOP_KEY, shops[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops])

  const setActiveShopId = (id: string) => {
    setActiveShopIdState(id)
    saveJSON(ACTIVE_SHOP_KEY, id)
  }

  const activeShop = shops.find((s) => s.id === activeShopId) ?? shops[0] ?? null

  // Placeholder setter kept for API symmetry — shops always come from
  // `user.shops` via AuthContext.refresh(); nothing currently needs to patch
  // the list in place without a full /me refetch.
  const refreshShops = () => {}

  const value = useMemo(
    () => ({ shops, activeShop, activeShopId: activeShop?.id ?? null, setActiveShopId, refreshShops }),
    [shops, activeShop],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
