<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'

const { t } = useI18n()
const { items: favorites } = storeToRefs(useFavoritesStore())
</script>

<template>
  <nav class="segmented tabs" :aria-label="t('nav.label')">
    <RouterLink
      :to="{ name: 'home' }"
      class="segmented__option tabs__link"
      exact-active-class="segmented__option--active"
    >
      {{ t('nav.home') }}
    </RouterLink>
    <RouterLink
      :to="{ name: 'favorites' }"
      class="segmented__option tabs__link"
      exact-active-class="segmented__option--active"
    >
      {{ t('nav.favorites') }}
      <span v-if="favorites.length" class="tabs__count">{{ favorites.length }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 120px;
  padding: 7px 18px;
  font-size: 15px;
}

.tabs__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--accent-tint-strong);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
}

@media (max-width: 519px) {
  .tabs {
    display: flex;
  }

  .tabs__link {
    flex: 1;
    min-width: 0;
  }
}
</style>
