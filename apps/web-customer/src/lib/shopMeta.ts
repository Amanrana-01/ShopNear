import {
  Store, ShoppingBasket, PencilRuler, Wrench, Pill, CroissantIcon, Milk,
  CookingPot, Carrot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ShopSummary } from '@shopnear/shared'

/**
 * Everything the UI needs to render a shop type consistently: a label, an
 * icon, and a tint. Keyed loosely rather than by `ShopSummary['type']` because
 * search rows return a minimal shop stub with no `type` at all.
 */
interface ShopTypeMeta {
  label: string
  Icon: LucideIcon
  /** Tailwind classes for the avatar tile — kept together so a shop reads the
   * same on the home list, the search row, and the order card. */
  tile: string
}

const FALLBACK: ShopTypeMeta = { label: 'Shop', Icon: Store, tile: 'bg-brand-50 text-brand-600' }

const META: Record<string, ShopTypeMeta> = {
  KIRANA: { label: 'Kirana', Icon: ShoppingBasket, tile: 'bg-brand-50 text-brand-600' },
  GENERAL: { label: 'General store', Icon: Store, tile: 'bg-brand-50 text-brand-600' },
  STATIONERY: { label: 'Stationery', Icon: PencilRuler, tile: 'bg-sky-50 text-sky-600' },
  HARDWARE: { label: 'Hardware', Icon: Wrench, tile: 'bg-slate-100 text-slate-600' },
  CHEMIST: { label: 'Chemist', Icon: Pill, tile: 'bg-success-50 text-success-700' },
  BAKERY: { label: 'Bakery', Icon: CroissantIcon, tile: 'bg-amber-50 text-amber-700' },
  DAIRY: { label: 'Dairy', Icon: Milk, tile: 'bg-sky-50 text-sky-600' },
  FARSAN: { label: 'Farsan', Icon: CookingPot, tile: 'bg-accent-50 text-accent-700' },
  VEGETABLE: { label: 'Vegetables', Icon: Carrot, tile: 'bg-success-50 text-success-700' },
}

export function shopMeta(type: string | undefined): ShopTypeMeta {
  return (type && META[type]) || FALLBACK
}

/** Chips shown above the shop list. Ordered by how often people actually want
 * them, not alphabetically. */
export const SHOP_TYPE_FILTERS: { value: ShopSummary['type'] | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'KIRANA', label: 'Kirana' },
  { value: 'VEGETABLE', label: 'Vegetables' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'CHEMIST', label: 'Chemist' },
  { value: 'FARSAN', label: 'Farsan' },
  { value: 'GENERAL', label: 'General' },
  { value: 'STATIONERY', label: 'Stationery' },
  { value: 'HARDWARE', label: 'Hardware' },
]

/**
 * Pickup and delivery estimates, derived from distance rather than stored.
 *
 * The API contract has no ETA field and adding one would be a contract change
 * for something that is a pure function of a number we already have. Walking
 * is ~80 m/min plus a minute to be served; delivery adds the shop's own
 * picking time on top of a rider covering the same ground faster.
 */
export function walkMinutes(distanceMeters: number): number {
  return Math.max(2, Math.round(distanceMeters / 80) + 1)
}

export function deliveryMinutes(distanceMeters: number): number {
  return Math.max(8, Math.round(distanceMeters / 220) + 8)
}

/** "12 min" — the headline number a quick-commerce app leads with. */
export function formatMinutes(minutes: number): string {
  return `${minutes} min`
}
