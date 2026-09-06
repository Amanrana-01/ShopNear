/**
 * Real product photography.
 *
 * One product, one photograph of *that* product. A generic glass of milk on
 * "Amul Taaza Milk 500 ml" is not a product image, it is a category image
 * wearing a product's name, so nothing here substitutes one for another: a
 * product either has its own file or it has none.
 *
 * Files live in `src/assets/products/` and are named for the product's slug
 * — the part of `Product.id` after `prod_`. `amul-taaza-milk-500-ml.jpg`
 * fills in for `prod_amul-taaza-milk-500-ml`, and nothing else does.
 *
 * The map is built by Vite from the directory contents, so adding a file is
 * the whole of the work: drop it in, and the tile picks it up on the next
 * build. `product-images.test.ts` is the loud half — it fails if a file lands
 * whose name matches no product (a typo'd slug silently reaching nothing is
 * exactly the failure this indirection exists to prevent), and it regenerates
 * `REQUIRED.md`, the list of what is still missing.
 */

const FILES = import.meta.glob('../assets/products/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** slug → bundled URL, e.g. `amul-taaza-milk-500-ml` → `/assets/amul-….jpg`. */
export const PRODUCT_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''),
    url,
  ]),
)

/** The slug a product's image file must be named for. */
export function productImageSlug(productId: string): string {
  return productId.replace(/^prod_/, '')
}

/** The product's own photograph, or null when one has not been supplied yet. */
export function productImage(productId: string): string | null {
  return PRODUCT_IMAGE_MAP[productImageSlug(productId)] ?? null
}
