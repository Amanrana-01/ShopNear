import { SlidersHorizontal, Store } from 'lucide-react'
import type { ShopSummary } from '@shopnear/shared'
import { SelectMenu } from '@/components/ui/SelectMenu'
import { SHOP_TYPE_FILTERS, shopMeta } from '@/lib/shopMeta'
import { cn } from '@/lib/utils'

export type ShopTypeFilter = ShopSummary['type'] | null

/** The same tinted tile the shop cards use, at menu-row size — so a type
 * looks identical wherever it appears. */
function TypeGlyph({ value }: { value: ShopTypeFilter }) {
  const { Icon, tile } = value ? shopMeta(value) : { Icon: Store, tile: 'bg-brand-50 text-brand-600' }
  return (
    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md', tile)}>
      <Icon size={12} aria-hidden />
    </span>
  )
}

/**
 * Shop-type filter.
 *
 * This used to be a scrolling row of chips above the list, which cost a full
 * line of vertical space to show ten options people pick from rarely — and
 * the ones past "Chemist" were off-screen on a phone anyway. As a dropdown it
 * sits beside the radius picker, where the other "narrow this list" control
 * already lives, and the trigger carries the current choice instead of making
 * you scroll sideways to find it.
 */
export function ShopTypeControl({
  value, onChange, className,
}: { value: ShopTypeFilter; onChange: (v: ShopTypeFilter) => void; className?: string }) {
  const selected = SHOP_TYPE_FILTERS.find((f) => f.value === value) ?? SHOP_TYPE_FILTERS[0]

  return (
    <SelectMenu<ShopTypeFilter>
      value={selected.value}
      onChange={onChange}
      options={SHOP_TYPE_FILTERS.map((f) => ({
        value: f.value,
        label: f.value ? f.label : 'All shops',
        icon: <TypeGlyph value={f.value} />,
      }))}
      triggerLabel={selected.value ? selected.label : 'All shops'}
      triggerIcon={
        <SlidersHorizontal
          size={14}
          className={value ? 'text-brand-600' : 'text-brand-500'}
          aria-hidden
        />
      }
      triggerAriaLabel={`Shop type: ${selected.value ? selected.label : 'all shops'}`}
      menuLabel="Shop type"
      highlighted={value !== null}
      align="left"
      menuWidth={196}
      className={className}
    />
  )
}
