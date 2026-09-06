import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { registerMerchant, patchShop, ApiError } from '@/api/client'
import { useAuth } from '@/state/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { IconChevronLeft } from '@/components/ui/Icon'
import { loadWizardDraft, saveWizardDraft, clearWizardDraft, TOTAL_STEPS, STEP_NAMES } from './wizardState'
import type { WizardDraft } from './wizardState'
import StepOwner, { ownerStepValid } from './steps/StepOwner'
import StepShop, { shopStepValid } from './steps/StepShop'
import StepLocation, { locationStepValid } from './steps/StepLocation'
import StepTimings from './steps/StepTimings'
import StepFulfilment from './steps/StepFulfilment'
import StepVerification from './steps/StepVerification'
import StepInventory, { inventoryStepValid } from './steps/StepInventory'

export default function RegisterWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const { show } = useToast()
  const [draft, setDraft] = useState<WizardDraft>(() => loadWizardDraft())
  const [resumed] = useState(() => loadWizardDraft().step > 1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    saveWizardDraft(draft)
  }, [draft])

  function update(patch: Partial<WizardDraft>) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function isCurrentStepValid(): boolean {
    switch (draft.step) {
      case 1: return ownerStepValid(draft)
      case 2: return shopStepValid(draft)
      case 3: return locationStepValid(draft)
      case 7: return inventoryStepValid(draft)
      default: return true
    }
  }

  function goNext() {
    if (draft.step < TOTAL_STEPS) update({ step: draft.step + 1 })
    else submit()
  }
  function goBack() {
    if (draft.step > 1) update({ step: draft.step - 1 })
    else navigate('/login')
  }

  async function submit() {
    setSubmitting(true)
    try {
      const result = await registerMerchant({
        owner: draft.owner,
        shop: { name: draft.shop.name, nameGu: draft.shop.nameGu || draft.shop.name, type: draft.shop.type, description: draft.shop.description || undefined, phone: draft.shop.phone },
        location: draft.location,
        openingHours: draft.openingHours,
        fulfilment: draft.fulfilment,
        verification: draft.verification.licenceNumber ? { licenceNumber: draft.verification.licenceNumber } : undefined,
        starterItems: Object.entries(draft.starterItems).map(([productId, price]) => ({ productId, price })),
      })

      // The registration schema has no bannerImageUrl field (see
      // registration.schemas.ts) — the shop photo collected in step 6 is
      // persisted with a follow-up PATCH using the token registration just
      // issued, rather than needing a backend change.
      if (draft.verification.photoUrl) {
        try {
          await patchShop(result.shop.id, { bannerImageUrl: draft.verification.photoUrl })
        } catch { /* non-fatal — profile photo can be added later */ }
      }

      setUser({ ...result.user, shops: [result.shop] })
      clearWizardDraft()
      show(t('register.submitSuccess'), 'success')
      navigate('/pending', { replace: true })
    } catch (err) {
      show(err instanceof ApiError ? err.message : t('register.submitError'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const StepComponent = [StepOwner, StepShop, StepLocation, StepTimings, StepFulfilment, StepVerification, StepInventory][draft.step - 1]

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-[#F7F5FB]">
      <header className="sticky top-0 z-10 bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconChevronLeft size={20} />
          </button>
          <p className="text-sm font-semibold text-ink/60">{t('register.stepOf', { current: draft.step, total: TOTAL_STEPS })}</p>
          <LanguageSwitcher />
        </div>
        <div className="flex gap-1">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < draft.step ? 'bg-brand-500' : 'bg-brand-100'}`} />
          ))}
        </div>
        {resumed && draft.step > 1 && (
          <p className="mt-2 text-xs font-medium text-teal-700">{t('register.resumeBanner')}</p>
        )}
      </header>

      <div className="flex-1 px-4 py-5 pb-28">
        <StepComponent draft={draft} update={update} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-lg bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-nav">
        <Button
          size="xl"
          fullWidth
          disabled={!isCurrentStepValid()}
          loading={submitting}
          onClick={goNext}
        >
          {draft.step < TOTAL_STEPS ? t('common.next') : submitting ? t('register.submitting') : t('register.submitButton')}
        </Button>
      </div>
    </div>
  )
}
