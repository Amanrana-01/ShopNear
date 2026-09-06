import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useShop } from '@/state/ShopContext'
import { useToast } from '@/components/ui/Toast'
import { loadProductPool, searchProductPool } from '@/api/catalogue'
import { getAllShopInventory, putShopInventory, copyInventoryFromShop, getShopsNearby, ApiError } from '@/api/client'
import type { Product, ShopInventoryItem, Availability } from '@/api/types'
import { NEIGHBOURHOOD_ANCHOR } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { BarcodeScannerSheet } from '@/components/BarcodeScanner'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format'
import {
  IconSearch, IconBarcode, IconPackage, IconCheck, IconCheckCircle, IconClock, IconAlert, IconHelp, IconCopy,
} from '@/components/ui/Icon'

const AVAILABILITY_TONE: Record<Availability, { cls: string; Icon: typeof IconCheckCircle }> = {
  IN_STOCK: { cls: 'bg-teal-50 text-teal-700', Icon: IconCheckCircle },
  OUT_OF_STOCK: { cls: 'bg-rose-50 text-rose-700', Icon: IconAlert },
  USUALLY_AVAILABLE: { cls: 'bg-amber-50 text-amber-700', Icon: IconClock },
  UNKNOWN: { cls: 'bg-gray-100 text-gray-500', Icon: IconHelp },
}

function AvailabilityChip({ value, onChange }: { value: Availability; onChange: (v: Availability) => void }) {
  const { t } = useTranslation()
  const options: Availability[] = ['IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE']
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const info = AVAILABILITY_TONE[opt]
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors',
              active ? info.cls + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-400',
            )}
          >
            <info.Icon size={12} />
            {t(`inventoryPage.availability.${opt}`)}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

function BrowseTab({ shopId, existingIds }: { shopId: string; existingIds: Set<string> }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const poolQuery = useQuery({
    queryKey: ['product-pool'],
    queryFn: () => loadProductPool(NEIGHBOURHOOD_ANCHOR.lat, NEIGHBOURHOOD_ANCHOR.lng),
    staleTime: Infinity,
  })

  const available = useMemo(
    () => (poolQuery.data ? poolQuery.data.products.filter((p) => !existingIds.has(p.id)) : []),
    [poolQuery.data, existingIds],
  )
  const results = useMemo(() => {
    if (!poolQuery.data) return []
    if (!query.trim()) return available.slice(0, 60)
    return searchProductPool({ products: available, byBarcode: poolQuery.data.byBarcode }, query, 60)
  }, [poolQuery.data, available, query])

  function toggle(product: Product) {
    setSelected((s) => {
      const next = { ...s }
      if (product.id in next) delete next[product.id]
      else next[product.id] = product.mrp ?? 0
      return next
    })
  }

  function onBarcodeDetected(code: string) {
    setScannerOpen(false)
    const match = poolQuery.data?.byBarcode.get(code)
    if (!match) {
      show(t('inventoryPage.matchNotFound'), 'error')
      return
    }
    show(t('inventoryPage.matchFound', { name: match.name }), 'success')
    if (!existingIds.has(match.id)) {
      setSelected((s) => ({ ...s, [match.id]: match.mrp ?? 0 }))
      setQuery(match.name)
    }
  }

  const selectedCount = Object.keys(selected).length

  async function addSelected() {
    setSubmitting(true)
    try {
      const items = Object.entries(selected).map(([productId, price]) => ({ productId, price: price > 0 ? price : 1 }))
      await putShopInventory(shopId, items)
      show(t('inventoryPage.addedToast'), 'success')
      setSelected({})
      await queryClient.invalidateQueries({ queryKey: ['shop-inventory-all', shopId] })
      await queryClient.invalidateQueries({ queryKey: ['shop-inventory-page', shopId] })
    } catch (e) {
      show(e instanceof ApiError ? e.message : t('common.networkError'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('inventoryPage.searchPlaceholder')}
            className="pl-11"
          />
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          aria-label={t('inventoryPage.scanBarcode')}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
        >
          <IconBarcode size={22} />
        </button>
      </div>

      {poolQuery.isLoading && <ListSkeleton count={5} />}
      {poolQuery.isError && (
        <ErrorState title={t('common.somethingWrong')} description={t('common.networkError')} onRetry={() => poolQuery.refetch()} />
      )}
      {poolQuery.data && results.length === 0 && <EmptyState icon={<IconSearch size={26} />} title={t('inventoryPage.noResults')} />}

      <div className="flex flex-col gap-2">
        {results.map((product) => {
          const isSelected = product.id in selected
          return (
            <Card key={product.id} className={cn('flex items-center gap-3 p-3', isSelected && 'ring-2 ring-brand-400')}>
              <button
                type="button"
                onClick={() => toggle(product)}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2',
                  isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 bg-white',
                )}
                aria-pressed={isSelected}
                aria-label={product.name}
              >
                {isSelected && <IconCheck size={16} />}
              </button>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : <IconPackage size={20} className="text-brand-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                <p className="text-xs text-ink/50">{product.defaultUnitLabel}</p>
              </div>
              {isSelected && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-ink/50">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={selected[product.id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [product.id]: Number(e.target.value) }))}
                    className="w-16 rounded-lg border-2 border-brand-100 px-2 py-1 text-right text-sm"
                  />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-[64px] z-30 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
          <Button size="lg" fullWidth loading={submitting} onClick={addSelected} className="shadow-pop">
            {t('inventoryPage.addSelected', { count: selectedCount })}
          </Button>
        </div>
      )}

      <BarcodeScannerSheet open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={onBarcodeDetected} />
    </div>
  )
}

// ---------------------------------------------------------------------------

function CopyFromSheet({ open, onClose, shopId, shopType }: { open: boolean; onClose: () => void; shopId: string; shopType: string }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [copyingId, setCopyingId] = useState<string | null>(null)

  const nearbyQuery = useQuery({
    queryKey: ['shops-nearby-for-copy'],
    queryFn: () => getShopsNearby(NEIGHBOURHOOD_ANCHOR.lat, NEIGHBOURHOOD_ANCHOR.lng, 5000),
    enabled: open,
  })

  const candidates = useMemo(() => {
    const shops = (nearbyQuery.data ?? []).filter((s) => s.id !== shopId)
    return [...shops].sort((a, b) => (a.type === shopType ? -1 : 0) - (b.type === shopType ? -1 : 0))
  }, [nearbyQuery.data, shopId, shopType])

  async function copyFrom(otherShopId: string, otherName: string) {
    setCopyingId(otherShopId)
    try {
      const res = await copyInventoryFromShop(shopId, otherShopId)
      if (res.copiedCount === 0) {
        show(t('inventoryPage.copyFromEmpty'), 'info')
      } else {
        show(t('inventoryPage.copyFromSuccess', { count: res.copiedCount, shopName: otherName }), 'success')
      }
      await queryClient.invalidateQueries({ queryKey: ['shop-inventory-all', shopId] })
      await queryClient.invalidateQueries({ queryKey: ['shop-inventory-page', shopId] })
      onClose()
    } catch (e) {
      show(e instanceof ApiError ? e.message : t('common.networkError'), 'error')
    } finally {
      setCopyingId(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('inventoryPage.copyFromTitle')}>
      <p className="mb-3 text-sm text-ink/60">{t('inventoryPage.copyFromHint')}</p>
      {nearbyQuery.isLoading && <ListSkeleton count={3} />}
      <div className="flex flex-col gap-2">
        {candidates.map((shop) => (
          <div key={shop.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-brand-100 p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{shop.name}</p>
              <p className="text-xs text-ink/50">{shop.type}</p>
            </div>
            <Button size="sm" loading={copyingId === shop.id} onClick={() => copyFrom(shop.id, shop.name)}>
              <IconCopy size={14} /> {t('inventoryPage.copyFromButton')}
            </Button>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

function MyStockTab({ shopId, shopType }: { shopId: string; shopType: string }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [copyOpen, setCopyOpen] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, { price: number; availability: Availability }>>({})
  const [saving, setSaving] = useState(false)

  const inventoryQuery = useQuery({
    queryKey: ['shop-inventory-all', shopId],
    queryFn: () => getAllShopInventory(shopId),
  })

  const filtered = useMemo(() => {
    const items = inventoryQuery.data ?? []
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((i) => i.product.name.toLowerCase().includes(q))
  }, [inventoryQuery.data, query])

  function setDraft(item: ShopInventoryItem, patch: Partial<{ price: number; availability: Availability }>) {
    setDrafts((d) => ({
      ...d,
      [item.id]: { price: d[item.id]?.price ?? item.price, availability: d[item.id]?.availability ?? item.availability, ...patch },
    }))
  }

  const dirtyCount = Object.keys(drafts).length

  async function saveChanges() {
    setSaving(true)
    try {
      const items = Object.entries(drafts).map(([invId, draft]) => {
        const original = (inventoryQuery.data ?? []).find((i) => i.id === invId)!
        return { productId: original.productId, price: draft.price, availability: draft.availability }
      })
      await putShopInventory(shopId, items)
      show(t('inventoryPage.savedToast'), 'success')
      setDrafts({})
      await queryClient.invalidateQueries({ queryKey: ['shop-inventory-all', shopId] })
    } catch (e) {
      show(e instanceof ApiError ? e.message : t('common.networkError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('inventoryPage.myStockSearchPlaceholder')} className="pl-11" />
        </div>
        <Button variant="outline" onClick={() => setCopyOpen(true)}>
          <IconCopy size={16} />
        </Button>
      </div>

      {inventoryQuery.isLoading && <ListSkeleton count={5} />}
      {inventoryQuery.isError && (
        <ErrorState title={t('common.somethingWrong')} description={t('common.networkError')} onRetry={() => inventoryQuery.refetch()} />
      )}
      {inventoryQuery.data && filtered.length === 0 && <EmptyState icon={<IconPackage size={26} />} title={t('inventoryPage.myStockEmpty')} />}

      <div className="flex flex-col gap-2">
        {filtered.map((item) => {
          const draft = drafts[item.id]
          const price = draft?.price ?? item.price
          const availability = draft?.availability ?? item.availability
          return (
            <Card key={item.id} className="p-3">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                  {item.product.imageUrl ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <IconPackage size={20} className="text-brand-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.product.name}</p>
                  <p className="text-xs text-ink/50">{item.product.defaultUnitLabel} · {formatRelativeTime(item.availabilityUpdatedAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-ink/50">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setDraft(item, { price: Number(e.target.value) })}
                    className="w-16 rounded-lg border-2 border-brand-100 px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
              <div className="mt-2">
                <AvailabilityChip value={availability} onChange={(v) => setDraft(item, { availability: v })} />
              </div>
            </Card>
          )
        })}
      </div>

      {dirtyCount > 0 && (
        <div className="fixed inset-x-0 bottom-[64px] z-30 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
          <Button size="lg" fullWidth loading={saving} onClick={saveChanges} className="shadow-pop">
            {t('inventoryPage.saveChanges')} ({dirtyCount})
          </Button>
        </div>
      )}

      <CopyFromSheet open={copyOpen} onClose={() => setCopyOpen(false)} shopId={shopId} shopType={shopType} />
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function Inventory() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const [tab, setTab] = useState<'browse' | 'mine'>('browse')

  const inventoryQuery = useQuery({
    queryKey: ['shop-inventory-all', activeShop?.id],
    queryFn: () => getAllShopInventory(activeShop!.id),
    enabled: !!activeShop,
  })

  const existingIds = useMemo(() => new Set((inventoryQuery.data ?? []).map((i) => i.productId)), [inventoryQuery.data])

  if (!activeShop) return null

  return (
    <div className="px-4 py-4">
      <h1 className="mb-3 font-display text-xl font-bold text-ink">{t('inventoryPage.title')}</h1>
      <div className="mb-4 flex gap-2 rounded-full bg-brand-50 p-1">
        {(['browse', 'mine'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors',
              tab === key ? 'bg-brand text-white shadow-soft' : 'text-brand-700/70',
            )}
          >
            {key === 'browse' ? t('inventoryPage.tabBrowse') : t('inventoryPage.tabMine')}
          </button>
        ))}
      </div>

      {tab === 'browse' ? (
        <BrowseTab shopId={activeShop.id} existingIds={existingIds} />
      ) : (
        <MyStockTab shopId={activeShop.id} shopType={activeShop.type} />
      )}
    </div>
  )
}
