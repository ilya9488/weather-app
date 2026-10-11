<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'

const { t } = useI18n()
const { items: favorites } = storeToRefs(useFavoritesStore())
</script>

<template>
  <nav class="tabs" :aria-label="t('nav.label')">
    <RouterLink :to="{ name: 'home' }" class="tabs__link" exact-active-class="tabs__link--active">
      {{ t('nav.home') }}
    </RouterLink>
    <RouterLink
      :to="{ name: 'favorites' }"
      class="tabs__link"
      exact-active-class="tabs__link--active"
    >
      {{ t('nav.favorites') }}
      <span v-if="favorites.length" class="tabs__count">{{ favorites.length }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  padding-left: 12px;
}

.tabs__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: var(--muted);
  font-weight: 500;
  text-decoration: none;
  transition:
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.tabs__link:hover {
  color: var(--ink);
}

.tabs__link--active {
  border-color: var(--line);
  background: var(--surface-2);
  color: var(--ink);
}

/* Merge the active tab with the panel below */
.tabs__link--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--surface-2);
}

.tabs__link:focus-visible {
  outline-offset: -2px;
}

.tabs__count {
  min-width: 22px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  background: var(--sun);
  color: #1d1500;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}
</style>
