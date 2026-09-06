import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { HoursEditor } from '@/components/shared/HoursEditor'

export default function StepTimings({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.timings.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.timings.subheading')}</p>
      </div>
      <HoursEditor value={draft.openingHours} onChange={(openingHours) => update({ openingHours })} />
    </div>
  )
}
