<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import DecorLeaves from '@/components/ui/DecorLeaves.vue'

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
      <span class="favorites__sprout"><DecorLeaves variant="sprout" /></span>
      <p>{{ t('favorites.empty') }}</p>
      <RouterLink :to="{ name: 'home' }" class="btn btn--primary">{{ t('nav.home') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.favorites__blocks {
  display: grid;
  gap: 44px;
}

.favorites__empty {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  min-height: 320px;
  padding: 32px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--muted);
  font-weight: 500;
  text-align: center;
}

.favorites__sprout {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--accent-soft);
}

.favorites__sprout svg {
  width: 64px;
  height: 64px;
}

.block-list-leave-active {
  transition: opacity 200ms var(--ease);
}

.block-list-leave-to {
  opacity: 0;
}

@media (max-width: 519px) {
  .favorites__blocks {
    gap: 36px;
  }
}
</style>
