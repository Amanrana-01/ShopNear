import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { Input, Textarea, FieldLabel } from '@/components/ui/Input'
import { LocationPinPicker } from '@/components/shared/LocationPinPicker'

export function locationStepValid(draft: WizardDraft): boolean {
  return draft.location.address.trim().length > 0 && draft.location.pincode.trim().length > 0
}

export default function StepLocation({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.location.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.location.subheading')}</p>
      </div>

      <LocationPinPicker
        lat={draft.location.lat}
        lng={draft.location.lng}
        onChange={(lat, lng) => update({ location: { ...draft.location, lat, lng } })}
      />

      <div>
        <FieldLabel>{t('register.location.addressLabel')}</FieldLabel>
        <Textarea
          rows={2}
          value={draft.location.address}
          onChange={(e) => update({ location: { ...draft.location, address: e.target.value } })}
          placeholder={t('register.location.addressPlaceholder')}
        />
      </div>
      <div>
        <FieldLabel>{t('register.location.landmarkLabel')} <span className="font-normal text-ink/40">({t('common.optional')})</span></FieldLabel>
        <Input
          value={draft.location.landmark}
          onChange={(e) => update({ location: { ...draft.location, landmark: e.target.value } })}
          placeholder={t('register.location.landmarkPlaceholder')}
        />
      </div>
      <div>
        <FieldLabel>{t('register.location.pincodeLabel')}</FieldLabel>
        <Input
          inputMode="numeric"
          maxLength={6}
          value={draft.location.pincode}
          onChange={(e) => update({ location: { ...draft.location, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
        />
      </div>
    </div>
  )
}
