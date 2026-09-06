import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { getStarterCatalogue } from '@/api/client'
import { Card } from '@/components/ui/Card'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { IconCheck, IconPackage } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export function inventoryStepValid(draft: WizardDraft): boolean {
  return Object.keys(draft.starterItems).length > 0
}

export default function StepInventory({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['starter-catalogue', draft.shop.type],
    queryFn: () => getStarterCatalogue(draft.shop.type),
  })

  const items = query.data ?? []
  const selectedCount = Object.keys(draft.starterItems).length

  function toggle(productId: string, suggestedPrice: number) {
    const next = { ...draft.starterItems }
    if (productId in next) delete next[productId]
    else next[productId] = suggestedPrice
    update({ starterItems: next })
  }

  function selectAll() {
    const next: Record<string, number> = {}
    for (const item of items) next[item.productId] = item.suggestedPrice
    update({ starterItems: next })
  }

  function clearAll() {
    update({ starterItems: {} })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.inventory.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.inventory.subheading', { shopType: t(`register.shop.types.${draft.shop.type}`) })}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-700">{t('register.inventory.selectedCount', { count: selectedCount })}</p>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs font-semibold text-brand-600 underline">{t('common.selectAll')}</button>
          <button type="button" onClick={clearAll} className="text-xs font-semibold text-ink/40 underline">{t('common.deselectAll')}</button>
        </div>
      </div>

      {query.isLoading && <ListSkeleton count={5} />}
      {query.isError && <ErrorState title={t('common.somethingWrong')} onRetry={() => query.refetch()} />}
      {query.data && items.length === 0 && <EmptyState icon={<IconPackage size={26} />} title={t('register.inventory.emptyCatalogue')} />}

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const selected = item.productId in draft.starterItems
          const price = draft.starterItems[item.productId] ?? item.suggestedPrice
          return (
            <Card key={item.productId} className={cn('flex items-center gap-3 p-3', selected && 'ring-2 ring-brand-400')}>
              <button
                type="button"
                onClick={() => toggle(item.productId, item.suggestedPrice)}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2',
                  selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 bg-white',
                )}
              >
                {selected && <IconCheck size={16} />}
              </button>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <IconPackage size={20} className="text-brand-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink/50">{item.defaultUnitLabel}</p>
              </div>
              {selected && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-ink/50">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => update({ starterItems: { ...draft.starterItems, [item.productId]: Number(e.target.value) } })}
                    className="w-16 rounded-lg border-2 border-brand-100 px-2 py-1 text-right text-sm"
                  />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
