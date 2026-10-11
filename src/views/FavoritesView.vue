<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'

const { t } = useI18n()
const favorites = useFavoritesStore()
const { items } = storeToRefs(favorites)
</script>

<template>
  <section class="favorites">
    <h1 class="visually-hidden">{{ t('nav.favorites') }}</h1>

    <TransitionGroup v-if="items.length" tag="div" name="block-list" class="favorites__blocks">
      <WeatherBlock
        v-for="city in items"
        :key="city.id"
        :city="city"
        :mode="favorites.getMode(city.id)"
        @update:mode="favorites.setMode(city.id, $event)"
      />
    </TransitionGroup>

    <div v-else class="favorites__empty">
      <p>{{ t('favorites.empty') }}</p>
      <RouterLink :to="{ name: 'home' }" class="btn btn--primary">{{ t('nav.home') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.favorites__blocks {
  display: grid;
  gap: 20px;
}

.favorites__empty {
  display: grid;
  place-items: center;
  gap: 16px;
  min-height: 280px;
  padding: 32px 16px;
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-lg);
  color: var(--muted);
  text-align: center;
}

.favorites__empty .btn {
  text-decoration: none;
}

.block-list-leave-active {
  transition: opacity 200ms var(--ease);
}

.block-list-leave-to {
  opacity: 0;
}
</style>
