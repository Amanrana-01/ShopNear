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

const EMPTY: CartState = { shop: null, items: [] }

/**
 * Reads the persisted cart back defensively.
 *
 * `JSON.parse` returns `any`, and what comes out of localStorage is not
 * necessarily what this version of the app put in — a cart saved by an older
 * build, a half-written value, someone editing devtools. A cast alone would
 * turn any of those into a crash on first render, and a crash on load loses
 * the whole session rather than one bad line. Anything that doesn't look like
 * a cart line is dropped; anything that does is kept.
 */
function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return EMPTY

    const { shop, items } = parsed as { shop?: unknown; items?: unknown }
    if (!Array.isArray(items)) return EMPTY

    const valid = items.filter((i): i is CartItem => {
      if (typeof i !== 'object' || i === null) return false
      const line = i as Partial<CartItem>
      return (
        typeof line.product === 'object' && line.product !== null &&
        typeof line.product.id === 'string' &&
        typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0 &&
        typeof line.unitPrice === 'number' && Number.isFinite(line.unitPrice)
      )
    })
    if (valid.length === 0) return EMPTY

    const validShop =
      typeof shop === 'object' && shop !== null && typeof (shop as { id?: unknown }).id === 'string'
        ? (shop as ShopSummary)
        : null
    // Lines without their shop can't be reserved or priced, so an unreadable
    // shop empties the cart rather than leaving orphaned lines behind.
    return validShop ? { shop: validShop, items: valid } : EMPTY
  } catch {
    return EMPTY
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private browsing or a full quota. The cart still works for this
      // session; it just won't survive a reload, which beats crashing.
    }
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
