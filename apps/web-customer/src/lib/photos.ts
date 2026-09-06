/**
 * Real photography for categories, products, shops and banners.
 *
 * **Every entry below has been looked at.** An earlier version of this file
 * only checked that each id returned HTTP 200, which turned out to guarantee
 * nothing about the subject — "nuts & seeds" was a pile of onions, "edible
 * oils" was a broccoli floret, and "pooja items" was a photograph of skiers.
 * Entries that could not be visually confirmed were removed rather than left
 * in place, which is why several categories carry one photo instead of two.
 *
 * Two sources:
 * - `images.unsplash.com` ids, for everything with good generic photography.
 * - `/photos/*.jpg`, bundled locally, for the Indian-specific subjects that
 *   Unsplash does not cover (toor dal, agarbatti, mithai, khajur). These come
 *   from Wikimedia Commons under CC/CC0 — see public/photos/CREDITS.md. They
 *   are bundled rather than hotlinked because upload.wikimedia.org rate-limits
 *   (429s) under even light use, and an intermittently blank tile is worse
 *   than a 60 KB image.
 *
 * Subjects are honest photographs of the category, never branded pack shots:
 * reproducing real product packaging would mean serving someone else's brand
 * assets.
 */

const U = 'https://images.unsplash.com/photo-'

/** Anything starting with `/` is a bundled local file and is used as-is. */
const isLocal = (ref: string) => ref.startsWith('/')

/** Leaf-category photography. Keys match `Product.categorySlug`. */
const CATEGORY_PHOTOS: Record<string, string[]> = {
  'flours-grains': ['1574323347407-f5e1ad6d020b'],
  'pulses-dals': ['/photos/toor-dal.jpg'],
  rice: ['1586201375761-83865001e31c', '1536304993881-ff6e9eefa2a6'],
  'edible-oils': ['1474979266404-7eaacbcd87c5'],
  'spices-masala': ['1596040033229-a9821ebd058d', '1509358271058-acd22cc93898'],
  'sugar-jaggery': ['1518110925495-5fe2fda0442c'],

  'milk-curd': ['1550583724-b2692b85b150', '1563636619-e9143da7973b'],
  'butter-ghee': ['1589985270826-4b7bb135bc9d'],
  'cheese-paneer': ['1486297678162-eb2a19b0a32d', '1452195100486-9cc805987862'],

  'bread-buns': ['1586444248902-2f64eddc13df', '1509440159596-0249088772ff'],
  'biscuits-cookies': ['1499636136210-6f4ee915583e', '1558961363-fa8fdf82db35'],
  'cakes-rusks': ['1578985545062-69928b1d9587', '1464349095431-e9a21285b5f3'],

  'bath-soap': ['1584305574647-0cc949a2bb9f', '1600857544200-b2f666a9a2ec'],
  'shampoo-haircare': ['1608248543803-ba4f8c70ae0b'],
  'oral-care': ['1607613009820-a29f7bb81c04'],

  'cleaning-supplies': ['1563453392212-326f5e854473', '1583947215259-38e31be8751f'],
  laundry: ['1582735689369-4fe89db7114c', '1610557892470-55d9e80c0bce'],
  'pooja-items': ['/photos/pooja-incense.jpg'],

  'tea-coffee': ['1544787219-7f47ccb76574', '1495474472287-4d71bcdd2085'],
  'soft-drinks': ['1554866585-cd94860890b7', '1622483767028-3f66f32aef97'],
  'juices-health-drinks': ['1600271886742-f049cd451bba', '1613478223719-2ab802602423'],

  'namkeen-chips': ['1566478989037-eec170784d0b', '1613919113640-25732ec5e61f'],
  'chocolates-candy': ['1511381939415-e44015466834', '1548907040-4baa42d10919'],
  'instant-noodles': ['1612929633738-8fe44f7ec841', '1585032226651-759b368d7246'],

  'notebooks-paper': ['1531346878377-a5be20888e57', '1517842645767-c639042777db'],
  'pens-pencils': ['1583485088034-697b5bc54ccd', '1455390582262-044cdead277a'],
  'art-craft': ['1513364776144-60967b0f800f', '1452860606245-08befc0ff44b'],

  tools: ['1530124566582-a618bc2615dc', '1572981779307-38b8cabb2407'],
  electrical: ['1621905251189-08b45d6a269e'],
  paints: ['1562259949-e8e7689d7828'],

  'otc-medicines': ['1584308666744-24d5c474f2ae', '1471864190281-a93a3070b6de'],
  'first-aid': ['1603398938378-e54eab446dde', '1585435557343-3b092031a831'],
  'baby-care': ['1515488042361-ee00e0ddd4e4', '1519689680058-324335c77eba'],

  'fresh-vegetables': ['1540420773420-3366772f4999', '1518843875459-f738682238a6'],
  'fresh-fruits': ['1610832958506-aa56368176cf', '1619566636858-adf3ef46400b'],

  'namkeen-farsan': ['1601050690597-df0568f70950', '1606491956689-2ea866880c84'],
  'sweets-mithai': ['/photos/mithai-gulab-jamun.jpg', '/photos/mithai-gulab-jamun-2.jpg'],

  'nuts-seeds': ['1608797178974-15b35a64ede9'],
  'dried-fruits': ['/photos/dried-raisins.jpg', '/photos/dried-khajur.jpg'],
  'cereals-flakes': ['1521483451569-e33803c0330c', '1614961233913-a5113a4a34ed'],
  'jams-spreads': ['/photos/jams.jpg'],
  'ice-cream': ['1497034825429-c343d7c6a68f', '1567206563064-6f60f40a2b57', '1560008581-09826d1de69e'],
  'frozen-snacks': ['1541592106381-b31e9677c0e5', '1601050690597-df0568f70950'],
  'kitchen-tools': ['1590794056226-79ef3a8147e1'],
  'storage-containers': ['1610701596007-11502861dcfa'],
}

/** The tile for each top-level category — the most legible photo from that
 * aisle, chosen so the sixteen tiles read as distinct thumbnails. */
const TOP_LEVEL_PHOTOS: Record<string, string> = {
  groceries: '1596040033229-a9821ebd058d',
  dairy: '1550583724-b2692b85b150',
  bakery: '1586444248902-2f64eddc13df',
  'personal-care': '1600857544200-b2f666a9a2ec',
  household: '1583947215259-38e31be8751f',
  beverages: '1554866585-cd94860890b7',
  snacks: '1566478989037-eec170784d0b',
  stationery: '1531346878377-a5be20888e57',
  hardware: '1530124566582-a618bc2615dc',
  chemist: '1584308666744-24d5c474f2ae',
  vegetables: '1540420773420-3366772f4999',
  farsan: '1601050690597-df0568f70950',
  'dry-fruits': '1608797178974-15b35a64ede9',
  breakfast: '1521483451569-e33803c0330c',
  frozen: '1497034825429-c343d7c6a68f',
  'home-kitchen': '1590794056226-79ef3a8147e1',
}

const SHOP_PHOTOS: Record<string, string[]> = {
  KIRANA: ['1578916171728-46686eac8d58', '1604719312566-8912e9227c6a'],
  GENERAL: ['1604719312566-8912e9227c6a', '1578916171728-46686eac8d58'],
  CHEMIST: ['1576602976047-174e57a47881', '1587854692152-cbe660dbde88'],
  BAKERY: ['1517433670267-08bbd4be890f', '1509440159596-0249088772ff'],
  DAIRY: ['1563636619-e9143da7973b', '1550583724-b2692b85b150'],
  VEGETABLE: ['1488459716781-31db52582fe9', '1542838132-92c53300491e'],
  FARSAN: ['1601050690597-df0568f70950', '1606491956689-2ea866880c84'],
  STATIONERY: ['1497633762265-9d179a990aa6', '1524995997946-a1c2e315a42f'],
  HARDWARE: ['1530124566582-a618bc2615dc', '1581092918056-0c4c3acd3789'],
}

/** Hero banner photography, one per carousel slide. */
export const BANNER_PHOTOS = {
  list: '1542838132-92c53300491e',
  reserve: '1578916171728-46686eac8d58',
  compare: '1540420773420-3366772f4999',
} as const

/** Stable, non-negative hash so the same product always gets the same photo. */
function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface SizeOpts {
  /** Rendered CSS width in px; the URL requests 2× for retina. */
  w: number
  h?: number
}

function url(ref: string, { w, h }: SizeOpts): string {
  // Bundled files are already square-cropped at 480px, so there is nothing to
  // ask a CDN for; they are returned untouched.
  if (isLocal(ref)) return ref
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(w * 2), q: '70' })
  if (h) params.set('h', String(h * 2))
  return `${U}${ref}?${params.toString()}`
}

/** Photo for a product: leaf category first, then its top-level, then null. */
export function productPhoto(
  categorySlug: string | undefined,
  seed: string,
  size: SizeOpts,
): string | null {
  const slug = categorySlug ?? ''
  const options = CATEGORY_PHOTOS[slug]
  if (options && options.length > 0) return url(options[hash(seed) % options.length], size)
  const top = TOP_LEVEL_PHOTOS[slug]
  return top ? url(top, size) : null
}

/** Photo for a category tile (top-level or leaf). */
export function categoryPhoto(slug: string, size: SizeOpts): string | null {
  const top = TOP_LEVEL_PHOTOS[slug]
  if (top) return url(top, size)
  const options = CATEGORY_PHOTOS[slug]
  return options && options.length > 0 ? url(options[0], size) : null
}

/** Photo for a shop, varied by id so two kiranas on one screen differ. */
export function shopPhoto(type: string | undefined, seed: string, size: SizeOpts): string | null {
  const options = SHOP_PHOTOS[type ?? '']
  if (!options || options.length === 0) return url(TOP_LEVEL_PHOTOS.groceries, size)
  return url(options[hash(seed) % options.length], size)
}

export function bannerPhoto(key: keyof typeof BANNER_PHOTOS, size: SizeOpts): string {
  return url(BANNER_PHOTOS[key], size)
}
