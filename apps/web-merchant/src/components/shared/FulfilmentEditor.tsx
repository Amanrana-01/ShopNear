import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { FieldLabel, Input } from '@/components/ui/Input'
import { IconPackage, IconTruck } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

export interface FulfilmentValue {
  acceptsDelivery: boolean
  deliveryRadiusMeters: number
  minOrderValue: number
  deliveryFee: number
}

const RADIUS_PRESETS = [500, 1000, 2000, 3000]

/** Reserve & collect is always on; delivery is an opt-in toggle revealing
 * radius/minimum/fee (spec §5 step 5), shared between the registration
 * wizard and the shop-profile editor. */
export function FulfilmentEditor({ value, onChange }: { value: FulfilmentValue; onChange: (v: FulfilmentValue) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-start gap-3 border-2 border-teal-100 bg-teal-50 p-4">
        <IconPackage size={22} className="mt-0.5 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-800">{t('register.fulfilment.pickupTitle')}</p>
          <p className="text-sm text-teal-700/80">{t('register.fulfilment.pickupDescription')}</p>
        </div>
      </Card>

      <Card className="p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-semibold text-ink">
            <IconTruck size={20} className="text-brand-500" />
            {t('register.fulfilment.deliveryTitle')}
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={value.acceptsDelivery}
            onChange={(e) => onChange({ ...value, acceptsDelivery: e.target.checked })}
            className="h-7 w-12 shrink-0 appearance-none rounded-full bg-gray-200 transition-colors checked:bg-brand-500 relative before:absolute before:left-0.5 before:top-0.5 before:h-6 before:w-6 before:rounded-full before:bg-white before:shadow before:transition-transform checked:before:translate-x-5"
          />
        </label>
        <p className="mt-1 text-sm text-ink/55">{t('register.fulfilment.deliveryDescription')}</p>

        {value.acceptsDelivery && (
          <div className="mt-4 flex flex-col gap-4 border-t border-brand-50 pt-4">
            <div>
              <FieldLabel>{t('register.fulfilment.radiusLabel')}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {RADIUS_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange({ ...value, deliveryRadiusMeters: r })}
                    className={cn(
                      'min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold',
                      value.deliveryRadiusMeters === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-brand-100 text-ink/60',
                    )}
                  >
                    {r >= 1000 ? t('register.fulfilment.radiusKm', { value: r / 1000 }) : t('register.fulfilment.radiusMeters', { value: r })}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>{t('register.fulfilment.minOrderLabel')}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={value.minOrderValue}
                onChange={(e) => onChange({ ...value, minOrderValue: Number(e.target.value) })}
              />
            </div>
            <div>
              <FieldLabel>{t('register.fulfilment.feeLabel')}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={value.deliveryFee}
                onChange={(e) => onChange({ ...value, deliveryFee: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
