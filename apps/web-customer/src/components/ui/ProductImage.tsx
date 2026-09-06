import { useState } from 'react'
import type { Product } from '@shopnear/shared'
import { productPhoto } from '@/lib/photos'
import { productImage } from '@/lib/productImages'
import { CategoryIcon } from './CategoryIcon'
import { cn } from '@/lib/utils'

/**
 * Product artwork — a real photograph on the pale tile that quick-commerce
 * grids use, so the picture carries the tile rather than a coloured square
 * with a glyph on it.
 *
 * Four sources, in order: the product's own bundled photograph, then a real
 * `imageUrl` from the API if one ever exists, then category photography, then
 * a tinted glyph tile. Only the first is a picture of *this* product; the
 * middle two are stand-ins until `src/assets/products/` has the file. The last
 * is a true fallback — it appears if the network drops or a photo 404s, and it
 * is driven by `onError` so a broken image never renders as the browser's grey
 * placeholder.
 */

const SLUG_TO_TOP: Record<string, string> = {
  'flours-grains': 'groceries', 'pulses-dals': 'groceries', rice: 'groceries',
  'edible-oils': 'groceries', 'spices-masala': 'groceries', 'sugar-jaggery': 'groceries',
  'milk-curd': 'dairy', 'butter-ghee': 'dairy', 'cheese-paneer': 'dairy',
  'bread-buns': 'bakery', 'biscuits-cookies': 'bakery', 'cakes-rusks': 'bakery',
  'bath-soap': 'personal-care', 'shampoo-haircare': 'personal-care', 'oral-care': 'personal-care',
  'cleaning-supplies': 'household', laundry: 'household', 'pooja-items': 'household',
  'tea-coffee': 'beverages', 'soft-drinks': 'beverages', 'juices-health-drinks': 'beverages',
  'namkeen-chips': 'snacks', 'chocolates-candy': 'snacks', 'instant-noodles': 'snacks',
  'notebooks-paper': 'stationery', 'pens-pencils': 'stationery', 'art-craft': 'stationery',
  tools: 'hardware', electrical: 'hardware', paints: 'hardware',
  'otc-medicines': 'chemist', 'first-aid': 'chemist', 'baby-care': 'chemist',
  'fresh-vegetables': 'vegetables', 'fresh-fruits': 'vegetables',
  'namkeen-farsan': 'farsan', 'sweets-mithai': 'farsan',
  'nuts-seeds': 'dry-fruits', 'dried-fruits': 'dry-fruits',
  'cereals-flakes': 'breakfast', 'jams-spreads': 'breakfast',
  'ice-cream': 'frozen', 'frozen-snacks': 'frozen',
  'kitchen-tools': 'home-kitchen', 'storage-containers': 'home-kitchen',
}

const ICON_FOR_SLUG: Record<string, string> = {
  'flours-grains': 'wheat', 'pulses-dals': 'lentil', rice: 'rice',
  'edible-oils': 'bottle', 'spices-masala': 'spice', 'sugar-jaggery': 'sugar',
  'milk-curd': 'milk', 'butter-ghee': 'butter', 'cheese-paneer': 'cheese',
  'bread-buns': 'bread', 'biscuits-cookies': 'cookie', 'cakes-rusks': 'cake',
  'bath-soap': 'soap', 'shampoo-haircare': 'bottle', 'oral-care': 'toothbrush',
  'cleaning-supplies': 'spray', laundry: 'washing-machine', 'pooja-items': 'flame',
  'tea-coffee': 'cup', 'soft-drinks': 'bottle', 'juices-health-drinks': 'bottle',
  'namkeen-chips': 'chips', 'chocolates-candy': 'candy', 'instant-noodles': 'bowl',
  'notebooks-paper': 'notebook', 'pens-pencils': 'pen', 'art-craft': 'palette',
  tools: 'wrench', electrical: 'bulb', paints: 'paint',
  'otc-medicines': 'pill', 'first-aid': 'bandage', 'baby-care': 'baby',
  'fresh-vegetables': 'carrot', 'fresh-fruits': 'apple',
  'namkeen-farsan': 'bowl', 'sweets-mithai': 'sweet',
  'nuts-seeds': 'nut', 'dried-fruits': 'raisin',
  'cereals-flakes': 'cereal', 'jams-spreads': 'jam',
  'ice-cream': 'icecream', 'frozen-snacks': 'frozen',
  'kitchen-tools': 'utensils', 'storage-containers': 'container',
}

const ICON_FOR_TOP: Record<string, string> = {
  groceries: 'basket', dairy: 'milk', bakery: 'bread', 'personal-care': 'soap',
  household: 'spray', beverages: 'cup', snacks: 'chips', stationery: 'pencil',
  hardware: 'wrench', chemist: 'pill', vegetables: 'carrot', farsan: 'bowl',
  'dry-fruits': 'nut', breakfast: 'cereal', frozen: 'icecream', 'home-kitchen': 'utensils',
}

export interface ProductImageProps {
  product: Product
  /** `sm` list rows, `md` grid tiles, `lg` the detail page. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const PX = { sm: 96, md: 200, lg: 420 } as const
const GLYPH = { sm: 24, md: 40, lg: 80 } as const

export function ProductImage({ product, size = 'md', className }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  const slug = product.categorySlug ?? ''
  // The product's own photograph wins outright. Nothing else in the chain is
  // a picture of this product, so nothing else may displace it.
  const src =
    productImage(product.id) ??
    (product.imageUrl && /^https?:/.test(product.imageUrl)
      ? product.imageUrl
      : productPhoto(slug, product.id, { w: PX[size] }))

  if (!src || failed) {
    const iconName = ICON_FOR_SLUG[slug] ?? ICON_FOR_TOP[SLUG_TO_TOP[slug] ?? slug] ?? 'basket'
    return (
      <div
        aria-hidden
        className={cn(
          'flex h-full w-full items-center justify-center bg-[#F0F4FB] text-brand-300',
          className,
        )}
      >
        <CategoryIcon iconName={iconName} size={GLYPH[size]} />
      </div>
    )
  }

  return (
    <div className={cn('h-full w-full bg-[#F0F4FB]', className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
