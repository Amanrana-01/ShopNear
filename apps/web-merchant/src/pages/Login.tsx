import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { merchantLogin } from '@/api/client'
import { ApiError } from '@/api/client'
import { useAuth } from '@/state/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, FieldLabel, FieldError } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { IconStore } from '@/components/ui/Icon'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const { setUser } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await merchantLogin(phone.trim(), password)
      setUser(user)
      const dest = location.state?.from?.pathname ?? '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === 'UNAUTHORIZED' ? t('auth.login.invalidCredentials') : err.message)
      } else {
        setError(t('common.networkError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F7F5FB] px-5 py-10">
      <div className="mb-3 flex justify-end w-full max-w-sm">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-white shadow-pop">
          <IconStore size={32} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('common.appName')}</h1>
      </div>

      <Card className="w-full max-w-sm p-6 animate-fade-in-up">
        <h2 className="mb-1 font-display text-xl font-bold text-ink">{t('auth.login.title')}</h2>
        <p className="mb-5 text-sm text-ink/60">{t('auth.login.subtitle')}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <FieldLabel htmlFor="phone">{t('auth.login.phoneLabel')}</FieldLabel>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder={t('auth.login.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="password">{t('auth.login.passwordLabel')}</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" size="xl" fullWidth loading={submitting} disabled={phone.length !== 10 || password.length === 0}>
            {submitting ? t('auth.login.loggingIn') : t('auth.login.submit')}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-sm text-ink/60">
        {t('auth.login.registerPrompt')}{' '}
        <Link to="/register" className="font-semibold text-brand-600 underline underline-offset-2">
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </div>
  )
}
