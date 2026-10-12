<script setup>
import { computed, ref, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { Theme } from '@/constants'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

const { t } = useI18n()
const settings = useSettingsStore()
const { locale, theme } = storeToRefs(settings)
const langName = useId()

const LANGUAGES = [
  { value: 'uk', label: 'UA', name: 'Українська' },
  { value: 'en', label: 'EN', name: 'English' },
]

const isDark = computed(() => theme.value === Theme.DARK)

const { available: canInstall, canPrompt, prompt: promptInstall } = usePwaInstall()
const isIosHintOpen = ref(false)

function onInstallClick() {
  if (canPrompt.value) promptInstall()
  else isIosHintOpen.value = true
}
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink :to="{ name: 'home' }" class="logo" :aria-label="t('app.logoAlt')">
        <svg class="logo__mark" width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="32" class="logo__bg" />
          <circle cx="25" cy="26" r="10" class="logo__sun" />
          <g class="logo__cloud">
            <circle cx="32" cy="38" r="7" />
            <circle cx="42" cy="33" r="10" />
            <rect x="22" y="38" width="34" height="12" rx="6" />
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
          v-if="canInstall"
          type="button"
          class="icon-btn header__btn"
          :aria-label="t('install.button')"
          :title="t('install.button')"
          @click="onInstallClick"
        >
          <AppIcon name="install" :size="19" />
        </button>

        <button
          type="button"
          class="icon-btn header__btn"
          :aria-label="isDark ? t('settings.themeToLight') : t('settings.themeToDark')"
          :title="isDark ? t('settings.themeToLight') : t('settings.themeToDark')"
          @click="settings.toggleTheme"
        >
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="19" />
        </button>
      </div>
    </div>

    <BaseModal :open="isIosHintOpen" :title="t('install.iosTitle')" @close="isIosHintOpen = false">
      <ol class="ios-steps">
        <li>
          <span class="ios-steps__icon"><AppIcon name="share" :size="16" /></span>
          {{ t('install.iosStep1') }}
        </li>
        <li>{{ t('install.iosStep2') }}</li>
        <li>{{ t('install.iosStep3') }}</li>
      </ol>
    </BaseModal>
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

.header__btn {
  background: var(--fill);
  color: var(--ink);
}

.ios-steps {
  display: grid;
  gap: 10px;
  margin-top: 8px;
  padding-left: 20px;
  list-style: decimal;
  color: var(--ink);
}

.ios-steps li::marker {
  color: var(--muted);
}

.ios-steps__icon {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-right: 4px;
  border-radius: 7px;
  background: var(--fill);
  color: #0a84ff;
  vertical-align: middle;
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
