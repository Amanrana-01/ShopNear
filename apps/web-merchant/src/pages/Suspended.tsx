import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useShop } from '@/state/ShopContext'
import { useAuth } from '@/state/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { IconAlert, IconEdit, IconLogOut } from '@/components/ui/Icon'

export default function Suspended() {
  const { t } = useTranslation()
  const { activeShop } = useShop()
  const { logout } = useAuth()
  const navigate = useNavigate()

  if (!activeShop) return null

  return (
    <div className="flex min-h-dvh flex-col bg-[#F7F5FB] px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm font-semibold text-ink/50">
          <IconLogOut size={16} /> {t('common.logout')}
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col items-center text-center animate-fade-in-up">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <IconAlert size={40} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('suspended.title')}</h1>
        <p className="mt-1 max-w-xs text-ink/60">{t('suspended.subtitle', { shopName: activeShop.name })}</p>
      </div>
      <Card className="mt-8 p-5">
        <p className="text-sm text-ink/75">{t('suspended.description')}</p>
      </Card>
      <Button variant="outline" size="lg" fullWidth className="mt-6" onClick={() => navigate('/shop/profile')}>
        <IconEdit size={18} />
        {t('suspended.editProfile')}
      </Button>
    </div>
  )
}
