import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { FulfilmentEditor } from '@/components/shared/FulfilmentEditor'

export default function StepFulfilment({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.fulfilment.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.fulfilment.subheading')}</p>
      </div>
      <FulfilmentEditor value={draft.fulfilment} onChange={(fulfilment) => update({ fulfilment })} />
    </div>
  )
}
