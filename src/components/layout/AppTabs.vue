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
  gap: 8px;
}

.tabs__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-pill);
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition:
    color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.tabs__link:hover {
  background: var(--accent-soft);
}

.tabs__link--active,
.tabs__link--active:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.tabs__count {
  min-width: 22px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft-2);
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  line-height: 22px;
  text-align: center;
}

.tabs__link--active .tabs__count {
  background: var(--accent-ink);
  color: var(--accent);
}
</style>
