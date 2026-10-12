<script setup>
import { computed, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { Theme } from '@/constants'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t } = useI18n()
const settings = useSettingsStore()
const { locale, theme } = storeToRefs(settings)
const langName = useId()

const LANGUAGES = [
  { value: 'uk', label: 'UA', name: 'Українська' },
  { value: 'en', label: 'EN', name: 'English' },
]

const isDark = computed(() => theme.value === Theme.DARK)
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink :to="{ name: 'home' }" class="logo" :aria-label="t('app.logoAlt')">
        <svg class="logo__mark" width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="32" class="logo__bg" />
          <circle cx="26" cy="26" r="10" class="logo__sun" />
          <g class="logo__cloud">
            <circle cx="28" cy="40" r="8" />
            <circle cx="38" cy="34" r="10" />
            <circle cx="46" cy="41" r="7" />
            <rect x="20" y="40" width="33" height="8" rx="4" />
          </g>
        </svg>
        <span class="logo__text headline">{{ t('app.title') }}</span>
      </RouterLink>

      <div class="header__controls">
        <fieldset class="lang">
          <legend class="visually-hidden">{{ t('settings.language') }}</legend>
          <label
            v-for="lang in LANGUAGES"
            :key="lang.value"
            class="lang__option"
            :class="{ 'lang__option--active': locale === lang.value }"
            :title="lang.name"
          >
            <input
              class="visually-hidden"
              type="radio"
              :name="langName"
              :value="lang.value"
              :checked="locale === lang.value"
              :aria-label="lang.name"
              @change="settings.setLocale(lang.value)"
            />
            <span aria-hidden="true">{{ lang.label }}</span>
          </label>
        </fieldset>

        <button
          type="button"
          class="icon-btn theme-btn"
          :aria-label="isDark ? t('settings.themeToLight') : t('settings.themeToDark')"
          :title="isDark ? t('settings.themeToLight') : t('settings.themeToDark')"
          @click="settings.toggleTheme"
        >
          <AppIcon :name="isDark ? 'sun' : 'moon'" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  padding: 28px 0 20px;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: -4px;
  padding: 4px;
  border-radius: var(--radius-pill);
  text-decoration: none;
}

.logo__bg {
  fill: var(--accent);
}

.logo__sun {
  fill: var(--sun);
}

.logo__cloud {
  fill: #ffffff;
}

.logo__text {
  font-size: 28px;
}

.header__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang {
  display: inline-flex;
  margin: 0;
  padding: 3px;
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.lang__option {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.lang__option:hover {
  background: var(--accent-soft);
}

.lang__option--active,
.lang__option--active:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.lang__option:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-btn {
  border-color: var(--accent);
  background: var(--surface);
  color: var(--accent);
}

@media (max-width: 519px) {
  .header {
    padding: 16px 0 12px;
  }

  .logo {
    gap: 8px;
  }

  .logo__mark {
    width: 34px;
    height: 34px;
  }

  .logo__text {
    font-size: 22px;
  }
}
</style>
