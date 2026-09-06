/**
 * The catalogue, as the image pipeline sees it — plus the variant grouping
 * that decides which items are allowed to share a photograph.
 *
 * `variantGroupId` is *derived*, not hand-entered on 473 rows: it is the brand
 * plus the product name with every stated pack size stripped. So
 *
 *   Amul Chocolate Spread 200 g  ->  vg_amul_chocolate-spread
 *   Amul Chocolate Spread 400 g  ->  vg_amul_chocolate-spread     (same jar)
 *   Amul Butterscotch Ice Cream  ->  vg_amul_butterscotch-ice-cream
 *   Amul Kulfi                   ->  vg_amul_kulfi                (different)
 *
 * Derivation keeps the generator deterministic and keeps the field honest when
 * products are added. `VARIANT_GROUP_OVERRIDES` exists for the cases where the
 * naming does not carry the relationship.
 */
import { PRODUCTS } from '../../src/api/fixtures/products'
import { slugify, withoutSize } from './text'
import type { CatalogueItem } from './match'

/**
 * productId -> variantGroupId, for relationships the derivation cannot see.
 *
 * The derivation groups on the spelling, so two catalogue rows for the same
 * product spelled differently land in different groups and each claim their
 * own photograph. That is a catalogue inconsistency, not a matcher bug, and
 * this is where it gets recorded rather than papered over.
 */
export const VARIANT_GROUP_OVERRIDES: Readonly<Record<string, string>> = {
  // "Kit Kat" and "KitKat": one chocolate bar, two spellings in the fixture.
  'prod_nestle-kitkat-4-finger-37-3-g': 'vg_nestle_nestle-kit-kat-4-finger',
}

export function variantGroupIdFor(name: string, brand: string | null): string {
  const base = slugify(withoutSize(name))
  return brand ? `vg_${slugify(brand)}_${base}` : `vg_${base}`
}

export function loadCatalogue(): CatalogueItem[] {
  return PRODUCTS.map((p) => {
    const slug = p.id.replace(/^prod_/, '')
    const brand = p.brand ?? null
    return {
      id: p.id,
      slug,
      name: p.name,
      brand,
      // Drives the whole fallback policy. A branded item with no packshot gets
      // a placeholder - a generic photo there implies a specific product we
      // cannot back up. An unbranded commodity has no brand to mismatch and no
      // false specificity, so a photograph of that commodity is correct.
      isBranded: brand !== null,
      categorySlug: p.categorySlug ?? 'uncategorised',
      variantGroupId:
        VARIANT_GROUP_OVERRIDES[p.id] ?? variantGroupIdFor(p.name, p.brand ?? null),
    }
  })
}
