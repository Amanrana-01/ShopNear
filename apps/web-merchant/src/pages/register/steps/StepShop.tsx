import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { SHOP_TYPES } from '@/api/types'
import { Input, Textarea, FieldLabel } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const TYPE_EMOJI: Record<string, string> = {
  KIRANA: '🛒', GENERAL: '🏪', STATIONERY: '✏️', HARDWARE: '🔧', CHEMIST: '💊',
  BAKERY: '🍞', DAIRY: '🥛', FARSAN: '🍬', VEGETABLE: '🥕',
}

export function shopStepValid(draft: WizardDraft): boolean {
  return draft.shop.name.trim().length > 0 && !!draft.shop.type && /^\d{10}$/.test(draft.shop.phone)
}

export default function StepShop({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.shop.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.shop.subheading')}</p>
      </div>

      <div>
        <FieldLabel>{t('register.shop.nameLabel')}</FieldLabel>
        <Input
          value={draft.shop.name}
          onChange={(e) => update({ shop: { ...draft.shop, name: e.target.value } })}
          placeholder={t('register.shop.namePlaceholder')}
        />
      </div>

      <div>
        <FieldLabel>{t('register.shop.nameGuLabel')}</FieldLabel>
        <p className="mb-1.5 text-xs text-ink/45">{t('register.shop.nameGuHint')}</p>
        <Input
          value={draft.shop.nameGu}
          onChange={(e) => update({ shop: { ...draft.shop, nameGu: e.target.value } })}
        />
      </div>

      <div>
        <FieldLabel>{t('register.shop.typeLabel')}</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {SHOP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update({ shop: { ...draft.shop, type } })}
              className={cn(
                'flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center text-xs font-semibold',
                draft.shop.type === type ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-brand-100 text-ink/60',
              )}
            >
              <span className="text-2xl">{TYPE_EMOJI[type]}</span>
              {t(`register.shop.types.${type}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>{t('register.shop.phoneLabel')}</FieldLabel>
        <Input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={draft.shop.phone}
          onChange={(e) => update({ shop: { ...draft.shop, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
        />
      </div>

      <div>
        <FieldLabel>{t('register.shop.descriptionLabel')} <span className="font-normal text-ink/40">({t('common.optional')})</span></FieldLabel>
        <Textarea
          rows={2}
          value={draft.shop.description}
          onChange={(e) => update({ shop: { ...draft.shop, description: e.target.value } })}
          placeholder={t('register.shop.descriptionPlaceholder')}
        />
      </div>
    </div>
  )
}
