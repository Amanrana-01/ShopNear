import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShop } from '@/state/ShopContext'
import { useAuth } from '@/state/AuthContext'
import { patchShop, uploadFile, ApiError } from '@/api/client'
import type { OpeningHours } from '@/api/types'
import { useToast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldLabel } from '@/components/ui/Input'
import { HoursEditor } from '@/components/shared/HoursEditor'
import { FulfilmentEditor } from '@/components/shared/FulfilmentEditor'
import { ShopStatusBadge } from '@/components/StatusBadge'
import { IconCamera, IconLogOut, IconPackage } from '@/components/ui/Icon'

export default function ShopProfile() {
  const { t } = useTranslation()
  const { activeShop, shops, setActiveShopId } = useShop()
  const { logout, refresh } = useAuth()
  const { show } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(activeShop?.name ?? '')
  const [nameGu, setNameGu] = useState(activeShop?.nameGu ?? '')
  const [phone, setPhone] = useState(activeShop?.phone ?? '')
  const [address, setAddress] = useState(activeShop?.address ?? '')
  const [description, setDescription] = useState(activeShop?.description ?? '')
  const [photoUrl, setPhotoUrl] = useState(activeShop?.bannerImageUrl ?? null)
  const [openingHours, setOpeningHours] = useState<OpeningHours>(activeShop?.openingHours ?? { isTemporarilyClosed: false })
  const [fulfilment, setFulfilment] = useState({
    acceptsDelivery: activeShop?.acceptsDelivery ?? false,
    deliveryRadiusMeters: activeShop?.deliveryRadiusMeters ?? 500,
    minOrderValue: activeShop?.minOrderValue ?? 0,
    deliveryFee: activeShop?.deliveryFee ?? 0,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!activeShop) return null

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setPhotoUrl(url)
    } catch (err) {
      show(err instanceof ApiError ? err.message : t('common.networkError'), 'error')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await patchShop(activeShop!.id, {
        name, nameGu, phone, address, description,
        openingHours, bannerImageUrl: photoUrl ?? undefined,
        acceptsDelivery: fulfilment.acceptsDelivery,
        deliveryRadiusMeters: fulfilment.deliveryRadiusMeters,
        minOrderValue: fulfilment.minOrderValue,
        deliveryFee: fulfilment.deliveryFee,
      })
      show(t('profile.savedToast'), 'success')
      await refresh()
    } catch (err) {
      show(err instanceof ApiError ? err.message : t('common.networkError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">{t('profile.title')}</h1>
        <ShopStatusBadge status={activeShop.status} />
      </div>

      {shops.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shops.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveShopId(s.id)}
              className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold ${
                s.id === activeShop.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 text-ink/50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <Card className="flex flex-col items-center gap-2 p-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
          {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <IconPackage size={32} className="text-brand-300" />}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoSelected} />
        <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
          <IconCamera size={16} /> {t('profile.changePhoto')}
        </Button>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <p className="font-semibold text-ink/70">{t('profile.basicsTitle')}</p>
        <div>
          <FieldLabel>{t('profile.shopNameLabel')}</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>{t('profile.shopNameGuLabel')}</FieldLabel>
          <Input value={nameGu} onChange={(e) => setNameGu(e.target.value)} />
        </div>
        <div>
          <FieldLabel>{t('profile.phoneLabel')}</FieldLabel>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <FieldLabel>{t('profile.addressLabel')}</FieldLabel>
          <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <FieldLabel>{t('profile.descriptionLabel')}</FieldLabel>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 font-semibold text-ink/70">{t('profile.hoursTitle')}</p>
        <HoursEditor value={openingHours} onChange={setOpeningHours} />
      </Card>

      <div>
        <p className="mb-2 px-1 font-semibold text-ink/70">{t('profile.deliveryTitle')}</p>
        <FulfilmentEditor value={fulfilment} onChange={setFulfilment} />
      </div>

      <Button size="xl" fullWidth loading={saving} onClick={save}>
        {saving ? t('profile.saving') : t('profile.saveButton')}
      </Button>

      <button
        type="button"
        onClick={logout}
        className="mx-auto mt-2 flex items-center gap-1.5 text-sm font-semibold text-rose-600"
      >
        <IconLogOut size={16} /> {t('common.logout')}
      </button>
    </div>
  )
}
