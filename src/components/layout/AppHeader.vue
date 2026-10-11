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
        <svg class="logo__mark" width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" class="logo__bg" />
          <circle cx="26" cy="26" r="10" class="logo__sun" />
          <g class="logo__cloud">
            <circle cx="28" cy="40" r="8" />
            <circle cx="38" cy="34" r="10" />
            <circle cx="46" cy="41" r="7" />
            <rect x="20" y="40" width="33" height="8" rx="4" />
          </g>
        </svg>
        <span class="logo__text">{{ t('app.title') }}</span>
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
  padding: 24px 0 20px;
}

.header__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.logo {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  color: var(--ink);
  text-decoration: none;
}

.logo__bg {
  fill: var(--accent);
}

.logo__sun {
  fill: var(--sun);
}

.logo__cloud {
  fill: var(--surface);
}

.logo__text {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.header__controls {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang {
  display: inline-flex;
  margin: 0;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.lang__option {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.lang__option:hover {
  color: var(--ink);
}

.lang__option--active {
  background: var(--accent);
  color: var(--accent-ink);
}

.lang__option--active:hover {
  color: var(--accent-ink);
}

.lang__option:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-btn {
  border-color: var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
}

@media (max-width: 599px) {
  .header {
    padding: 16px 0;
  }

  .header__inner {
    grid-template-columns: auto 1fr;
  }

  .logo {
    grid-column: 1;
    margin-left: -8px;
  }

  .header__controls {
    grid-column: 2;
  }
}
</style>
