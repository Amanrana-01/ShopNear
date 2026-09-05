import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product, Offer, ShopSummary } from '@shopnear/shared'

export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  availability: Offer['availability']
  /** Null when the shop has never confirmed this item — the "Ask the shop"
   *  case, where reserving is still allowed. */
  availabilityUpdatedAt: string | null
}

interface CartState {
  shop: ShopSummary | null
  items: CartItem[]
}

/** Thrown when adding an item from a different shop than the current cart —
 * ShopNear reserves at one shop at a time, mirroring how you'd actually walk
 * into one store. The caller (AddToCartControl) catches this and asks the
 * customer to confirm starting a new cart. */
export class CartConflictError extends Error {
  constructor(public incomingShop: ShopSummary) {
    super(`Cart already has items from another shop`)
  }
}

interface CartContextValue {
  shop: ShopSummary | null
  items: CartItem[]
  itemCount: number
  subtotal: number
  quantityFor: (productId: string) => number
  addItem: (shop: ShopSummary, product: Product, offer: Offer, opts?: { force?: boolean }) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'shopnear.cart.v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartState) : { shop: null, items: [] }
    } catch {
      return { shop: null, items: [] }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addItem = useCallback<CartContextValue['addItem']>((shop, product, offer, opts) => {
    // Checked synchronously against the latest committed state — a throw
    // from inside a setState updater would surface as a React render error
    // instead of a catchable exception at the call site, so the conflict
    // check must happen here, before setState is ever called.
    if (state.shop && state.shop.id !== shop.id && state.items.length > 0 && !opts?.force) {
      throw new CartConflictError(shop)
    }
    setState((prev) => {
      const sameShop = prev.shop?.id === shop.id
      const items = sameShop ? [...prev.items] : []
      const idx = items.findIndex((i) => i.product.id === product.id)
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 }
      } else {
        items.push({
          product, quantity: 1, unitPrice: offer.price,
          availability: offer.availability, availabilityUpdatedAt: offer.availabilityUpdatedAt ?? null,
        })
      }
      return { shop, items }
    })
  }, [state.shop, state.items])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setState((prev) => {
      if (quantity <= 0) {
        const items = prev.items.filter((i) => i.product.id !== productId)
        return { shop: items.length > 0 ? prev.shop : null, items }
      }
      const items = prev.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      return { ...prev, items }
    })
  }, [])

  const removeItem = useCallback((productId: string) => setQuantity(productId, 0), [setQuantity])

  const clearCart = useCallback(() => setState({ shop: null, items: [] }), [])

  const quantityFor = useCallback(
    (productId: string) => state.items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [state.items],
  )

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [state.items],
  )
  const itemCount = useMemo(() => state.items.reduce((sum, i) => sum + i.quantity, 0), [state.items])

  const value = useMemo(
    () => ({ shop: state.shop, items: state.items, itemCount, subtotal, quantityFor, addItem, setQuantity, removeItem, clearCart }),
    [state.shop, state.items, itemCount, subtotal, quantityFor, addItem, setQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
