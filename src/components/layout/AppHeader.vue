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
        <svg class="logo__mark" width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
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
        <fieldset class="segmented">
          <legend class="visually-hidden">{{ t('settings.language') }}</legend>
          <label
            v-for="lang in LANGUAGES"
            :key="lang.value"
            class="segmented__option lang__option"
            :class="{ 'segmented__option--active': locale === lang.value }"
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
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="19" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Translucent bar that stays on top, like the iOS navigation bar */
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 62%, transparent);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
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
  gap: 10px;
  margin-left: -4px;
  padding: 4px;
  border-radius: var(--radius-pill);
  text-decoration: none;
}

.logo__bg {
  fill: var(--accent-solid);
}

.logo__sun {
  fill: var(--sun);
}

.logo__cloud {
  fill: #ffffff;
}

.logo__text {
  font-size: 21px;
}

.header__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang__option {
  min-width: 44px;
  padding: 4px 10px;
  font-size: 13px;
}

.theme-btn {
  background: var(--fill);
  color: var(--ink);
}

@media (max-width: 519px) {
  .header {
    padding: 10px 0;
  }

  .logo__text {
    font-size: 19px;
  }
}
</style>
