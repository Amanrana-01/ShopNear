import {
  ShoppingBasket, Wheat, Bean, Soup, Droplets, Flame, Nut, Milk, IceCreamBowl,
  Sandwich, Croissant, Cookie, CakeSlice, Sparkles, Brush, Home, SprayCan,
  WashingMachine, Coffee, Popcorn, Candy, Salad, PenLine, Notebook, Highlighter,
  Palette, Wrench, Lightbulb, PaintBucket, Pill, Bandage, Baby, Carrot, Apple,
  Store, Grape, IceCreamCone, Snowflake, Utensils, Container,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Category iconography.
 *
 * This replaces the emoji map that used to sit in CategoryStrip. Emoji render
 * in the user's system font, so the same "category rail" was a different set
 * of shapes, weights, and colours on every OS — and on Windows several of them
 * fell back to a monochrome outline that read as a broken image. A single
 * stroked icon set keeps the rail looking like one designed system, scales
 * cleanly, and inherits `currentColor` so tints work.
 */
const ICONS: Record<string, LucideIcon> = {
  basket: ShoppingBasket,
  wheat: Wheat,
  lentil: Bean,
  rice: Soup,
  bottle: Droplets,
  spice: Flame,
  sugar: Nut,
  milk: Milk,
  butter: IceCreamBowl,
  cheese: Sandwich,
  bread: Croissant,
  cookie: Cookie,
  cake: CakeSlice,
  soap: Sparkles,
  toothbrush: Brush,
  home: Home,
  spray: SprayCan,
  'washing-machine': WashingMachine,
  flame: Flame,
  cup: Coffee,
  chips: Popcorn,
  candy: Candy,
  bowl: Salad,
  pencil: PenLine,
  notebook: Notebook,
  pen: Highlighter,
  palette: Palette,
  wrench: Wrench,
  bulb: Lightbulb,
  paint: PaintBucket,
  pill: Pill,
  bandage: Bandage,
  baby: Baby,
  carrot: Carrot,
  apple: Apple,
  sweet: CakeSlice,
  raisin: Grape,
  cereal: Wheat,
  jam: IceCreamBowl,
  icecream: IceCreamCone,
  frozen: Snowflake,
  utensils: Utensils,
  container: Container,
}

/**
 * Per-top-level tint. Shares its hue vocabulary with
 * `hueForCategorySlug` in the fixtures, so a category's rail tile and the
 * product tiles inside it read as the same family.
 */
const TINTS: Record<string, string> = {
  groceries: 'bg-brand-50 text-brand-600',
  dairy: 'bg-sky-50 text-sky-600',
  bakery: 'bg-amber-50 text-amber-700',
  'personal-care': 'bg-pink-50 text-pink-600',
  household: 'bg-success-50 text-success-700',
  beverages: 'bg-accent-50 text-accent-700',
  snacks: 'bg-yellow-50 text-yellow-700',
  stationery: 'bg-indigo-50 text-indigo-600',
  hardware: 'bg-slate-100 text-slate-600',
  chemist: 'bg-emerald-50 text-emerald-700',
  vegetables: 'bg-lime-50 text-lime-700',
  farsan: 'bg-orange-50 text-orange-700',
  'dry-fruits': 'bg-amber-50 text-amber-700',
  breakfast: 'bg-yellow-50 text-yellow-700',
  frozen: 'bg-cyan-50 text-cyan-700',
  'home-kitchen': 'bg-slate-100 text-slate-600',
}

export function categoryTint(slug: string): string {
  return TINTS[slug] ?? 'bg-brand-50 text-brand-600'
}

export function CategoryIcon({
  iconName, size = 22, className,
}: { iconName: string; size?: number; className?: string }) {
  const Icon = ICONS[iconName] ?? Store
  return <Icon size={size} strokeWidth={1.7} className={cn('shrink-0', className)} aria-hidden />
}
