import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n, LOCALES } from '@/i18n'
import { Theme } from '@/constants'
import { readStorage, writeStorage } from '@/utils/storage'

function getInitialTheme() {
  const saved = readStorage('theme', null)
  if (Object.values(Theme).includes(saved)) return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT
}

/** Interface language and day/night theme, both persisted. */
export const useSettingsStore = defineStore('settings', () => {
  const locale = ref(i18n.global.locale.value)
  const theme = ref(getInitialTheme())

  function setLocale(value) {
    if (LOCALES.includes(value)) locale.value = value
  }

  function toggleTheme() {
    theme.value = theme.value === Theme.DARK ? Theme.LIGHT : Theme.DARK
  }

  // Apply to the document right away, persist only explicit user choices
  // (so the theme keeps following the OS until the user picks one).
  watch(
    locale,
    (value) => {
      i18n.global.locale.value = value
      document.documentElement.lang = value
    },
    { immediate: true },
  )
  watch(locale, (value) => writeStorage('locale', value))

  watch(theme, (value) => (document.documentElement.dataset.theme = value), { immediate: true })
  watch(theme, (value) => writeStorage('theme', value))

  return { locale, theme, setLocale, toggleTheme }
})
