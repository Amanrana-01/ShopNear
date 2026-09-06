import { ShopSwitcher } from '@/components/ShopSwitcher'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-brand pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] shadow-soft">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4">
        <ShopSwitcher />
        <LanguageSwitcher compact />
      </div>
    </header>
  )
}
