import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import gu from './locales/gu.json'

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = 'shopnear_merchant.language.v1'

function detectInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) return stored as AppLanguage
  } catch {
    /* ignore */
  }
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    gu: { translation: gu },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

// Every language switch (the header toggle, and the wizard's own "language
// chosen first" step) goes through this so the choice survives a reload —
// entirely local, no server round-trip (preferredLanguage is only synced to
// the account at registration/profile-save time).
export function setAppLanguage(lang: AppLanguage): void {
  i18n.changeLanguage(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
}

export default i18n
