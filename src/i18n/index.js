import { createI18n } from 'vue-i18n'
import uk from './locales/uk.json'
import en from './locales/en.json'
import { readStorage } from '@/utils/storage'

export const LOCALES = ['uk', 'en']
export const DEFAULT_LOCALE = 'uk'

export function getInitialLocale() {
  const saved = readStorage('locale', null)
  return LOCALES.includes(saved) ? saved : DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: { uk, en },
})
