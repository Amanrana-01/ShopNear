import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { uploadFile, ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { Input, FieldLabel } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconCamera, IconAlert, IconPackage } from '@/components/ui/Icon'

export default function StepVerification({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()
  const { show } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      update({ verification: { ...draft.verification, photoUrl: url } })
    } catch (err) {
      show(err instanceof ApiError ? err.message : t('common.networkError'), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.verification.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.verification.subheading')}</p>
      </div>

      <Card className="flex items-start gap-3 border-2 border-amber-100 bg-amber-50 p-4">
        <IconAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">{t('register.verification.demoNotice')}</p>
      </Card>

      <div>
        <FieldLabel>{t('register.verification.photoLabel')}</FieldLabel>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
            {draft.verification.photoUrl ? (
              <img src={draft.verification.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <IconPackage size={28} className="text-brand-300" />
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelected} />
          <Button variant="secondary" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            <IconCamera size={16} />
            {draft.verification.photoUrl ? t('register.verification.retakePhoto') : t('register.verification.uploadPhoto')}
          </Button>
        </div>
      </div>

      <div>
        <FieldLabel>{t('register.verification.licenceLabel')} <span className="font-normal text-ink/40">({t('common.optional')})</span></FieldLabel>
        <Input
          value={draft.verification.licenceNumber}
          onChange={(e) => update({ verification: { ...draft.verification, licenceNumber: e.target.value } })}
          placeholder={t('register.verification.licencePlaceholder')}
        />
      </div>

      <p className="text-xs text-ink/45">{t('register.verification.skipNote')}</p>
    </div>
  )
}
