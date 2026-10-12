<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'
import { MAX_FAVORITES } from '@/constants'
import { getCityName, getCityRegion } from '@/utils/city'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

/** Adds/removes a city to favorites; shows the limit modal when it's full. */
const props = defineProps({
  city: { type: Object, required: true },
})

const { t, locale } = useI18n()
const favorites = useFavoritesStore()
const isLimitModalOpen = ref(false)

const isFavorite = computed(() => favorites.isFavorite(props.city.id))
const cityName = computed(() => getCityName(props.city, locale.value))

function toggle() {
  if (isFavorite.value) {
    favorites.remove(props.city.id)
    return
  }
  if (!favorites.add(props.city)) isLimitModalOpen.value = true
}

function removeFavorite(cityId) {
  favorites.remove(cityId)
  isLimitModalOpen.value = false
}
</script>

<template>
  <button
    type="button"
    class="favorite-btn"
    :class="{ 'favorite-btn--active': isFavorite }"
    :aria-label="
      isFavorite
        ? t('favorites.removeLabel', { city: cityName })
        : t('favorites.addLabel', { city: cityName })
    "
    @click="toggle"
  >
    <AppIcon name="star" :filled="isFavorite" :size="18" />
    <span class="favorite-btn__text" aria-hidden="true">
      {{ isFavorite ? t('favorites.added') : t('favorites.add') }}
    </span>
  </button>

  <BaseModal
    :open="isLimitModalOpen"
    :title="t('favorites.limitTitle', { max: MAX_FAVORITES })"
    @close="isLimitModalOpen = false"
  >
    <p>{{ t('favorites.limitText', { city: cityName, max: MAX_FAVORITES }) }}</p>
    <ul class="limit-list">
      <li v-for="item in favorites.items" :key="item.id" class="limit-list__item">
        <span class="limit-list__city">
          <span class="limit-list__name">{{ getCityName(item, locale) }}</span>
          <span class="limit-list__region">{{ getCityRegion(item, locale) }}</span>
        </span>
        <button type="button" class="btn btn--ghost" @click="removeFavorite(item.id)">
          {{ t('favorites.remove') }}
        </button>
      </li>
    </ul>
  </BaseModal>
</template>

<style scoped>
.favorite-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px 0 14px;
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.favorite-btn:hover {
  background: var(--accent-soft);
}

.favorite-btn--active {
  background: var(--accent);
  color: var(--accent-ink);
}

.favorite-btn--active:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

@media (max-width: 519px) {
  .favorite-btn {
    width: 40px;
    padding: 0;
    justify-content: center;
  }

  .favorite-btn__text {
    display: none;
  }
}

.limit-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.limit-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 8px 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.limit-list__city {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.limit-list__name {
  color: var(--ink);
  font-weight: 700;
}

.limit-list__region {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
