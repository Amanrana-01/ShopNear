import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/state/AuthContext'
import { useShop } from '@/state/ShopContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ShopStatusBadge } from '@/components/StatusBadge'
import { IconClock, IconCheckCircle, IconEdit, IconRefresh, IconLogOut } from '@/components/ui/Icon'

export default function PendingApproval() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const { refresh, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  async function checkAgain() {
    setChecking(true)
    try {
      const me = await refresh()
      const shop = me?.shops.find((s) => s.id === activeShop?.id)
      if (shop && shop.status === 'ACTIVE') {
        navigate('/dashboard', { replace: true })
      }
    } finally {
      setChecking(false)
    }
  }

  if (!activeShop) return null

  return (
    <div className="flex min-h-dvh flex-col bg-[#F7F5FB] px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink/50"
        >
          <IconLogOut size={16} /> {t('common.logout')}
        </button>
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col items-center text-center animate-fade-in-up">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <IconClock size={40} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('pending.title')}</h1>
        <p className="mt-1 max-w-xs text-ink/60">{t('pending.subtitle', { shopName: activeShop.name })}</p>
        <ShopStatusBadge status={activeShop.status} className="mt-3" />
      </div>

      <Card className="mt-8 p-5">
        <h2 className="mb-3 font-display font-semibold text-ink">{t('pending.whatNextTitle')}</h2>
        <ol className="flex flex-col gap-3 text-sm text-ink/75">
          {[t('pending.step1'), t('pending.step2'), t('pending.step3')].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-4 flex items-start gap-3 border-2 border-amber-100 bg-amber-50 p-4">
        <IconCheckCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">{t('pending.noOrdersYet')}</p>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" fullWidth loading={checking} onClick={checkAgain}>
          <IconRefresh size={18} />
          {checking ? t('pending.checking') : t('pending.refresh')}
        </Button>
        <Button variant="outline" size="lg" fullWidth onClick={() => navigate('/shop/profile')}>
          <IconEdit size={18} />
          {t('pending.editProfile')}
        </Button>
      </div>
    </div>
  )
}
