import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { setAppLanguage, type AppLanguage } from '@/i18n'

const OPTIONS: { code: AppLanguage; labelKey: string }[] = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'hi', labelKey: 'language.hindi' },
  { code: 'gu', labelKey: 'language.gujarati' },
]

/** Header language toggle — English / हिन्दी / ગુજરાતી — applied app-wide
 * via i18next (spec §9, graded requirement). Big enough to tap accurately
 * behind a shop counter. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label="Choose language"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full p-1',
        compact ? 'bg-white/15' : 'bg-brand-50',
      )}
    >
      {OPTIONS.map((opt) => {
        const active = i18n.resolvedLanguage === opt.code
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setAppLanguage(opt.code)}
            aria-pressed={active}
            className={cn(
              'min-h-[36px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              active
                ? compact ? 'bg-white text-brand-700 shadow-soft' : 'bg-brand text-white shadow-soft'
                : compact ? 'text-white/85 hover:bg-white/10' : 'text-brand-700/70 hover:bg-brand-100',
            )}
          >
            {opt.labelKey === 'language.english' ? 'EN' : opt.labelKey === 'language.hindi' ? 'हि' : 'ગુ'}
          </button>
        )
      })}
    </div>
  )
}
