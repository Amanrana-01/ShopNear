import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WizardDraft } from '../wizardState'
import { setAppLanguage, type AppLanguage } from '@/i18n'
import { Input, FieldLabel } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const LANGS: { code: AppLanguage; native: string; labelKey: string }[] = [
  { code: 'en', native: 'English', labelKey: 'language.english' },
  { code: 'hi', native: 'हिन्दी', labelKey: 'language.hindi' },
  { code: 'gu', native: 'ગુજરાતી', labelKey: 'language.gujarati' },
]

export function ownerStepValid(draft: WizardDraft): boolean {
  return draft.owner.name.trim().length > 0 && /^\d{10}$/.test(draft.owner.phone) && draft.owner.password.length >= 8
}

export default function StepOwner({ draft, update }: { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void }) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{t('register.owner.heading')}</h2>
        <p className="text-sm text-ink/55">{t('register.owner.subheading')}</p>
      </div>

      <div>
        <FieldLabel>{t('register.owner.languageLabel')}</FieldLabel>
        <p className="mb-2 text-xs text-ink/45">{t('register.owner.languageHint')}</p>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { update({ owner: { ...draft.owner, preferredLanguage: l.code } }); setAppLanguage(l.code) }}
              className={cn(
                'min-h-[56px] rounded-2xl border-2 text-sm font-bold transition-colors',
                draft.owner.preferredLanguage === l.code ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-brand-100 text-ink/60',
              )}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="ownerName">{t('register.owner.nameLabel')}</FieldLabel>
        <Input
          id="ownerName"
          value={draft.owner.name}
          onChange={(e) => update({ owner: { ...draft.owner, name: e.target.value } })}
          placeholder={t('register.owner.namePlaceholder')}
        />
      </div>

      <div>
        <FieldLabel htmlFor="ownerPhone">{t('register.owner.phoneLabel')}</FieldLabel>
        <Input
          id="ownerPhone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={draft.owner.phone}
          onChange={(e) => update({ owner: { ...draft.owner, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
          placeholder={t('register.owner.phonePlaceholder')}
        />
      </div>

      <div>
        <FieldLabel htmlFor="ownerPassword">{t('register.owner.passwordLabel')}</FieldLabel>
        <p className="mb-1.5 text-xs text-ink/45">{t('register.owner.passwordHint')}</p>
        <div className="relative">
          <Input
            id="ownerPassword"
            type={showPassword ? 'text' : 'password'}
            value={draft.owner.password}
            onChange={(e) => update({ owner: { ...draft.owner, password: e.target.value } })}
            placeholder={t('register.owner.passwordPlaceholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-600"
          >
            {showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          </button>
        </div>
      </div>
    </div>
  )
}
