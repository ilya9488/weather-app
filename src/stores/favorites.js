import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { MAX_FAVORITES, ForecastMode } from '@/constants'
import { readStorage, writeStorage } from '@/utils/storage'
import { isValidCity, isValidMode } from '@/utils/validate'

const ITEMS_KEY = 'favorites'
const MODES_KEY = 'favoriteModes'

function restoreItems() {
  const saved = readStorage(ITEMS_KEY, [])
  return Array.isArray(saved) ? saved.filter(isValidCity).slice(0, MAX_FAVORITES) : []
}

function restoreModes() {
  const saved = readStorage(MODES_KEY, {})
  if (!saved || typeof saved !== 'object') return {}
  return Object.fromEntries(Object.entries(saved).filter(([, mode]) => isValidMode(mode)))
}

/** Favorite cities, persisted in localStorage, at most MAX_FAVORITES. */
export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref(restoreItems())
  // Day / 5 days mode of each block on the Favorites tab
  const modes = ref(restoreModes())

  const isFull = computed(() => items.value.length >= MAX_FAVORITES)

  function isFavorite(cityId) {
    return items.value.some((city) => city.id === cityId)
  }

  /** Returns false when the limit is reached. */
  function add(city) {
    if (isFavorite(city.id)) return true
    if (isFull.value) return false
    items.value.push(city)
    return true
  }

  function remove(cityId) {
    items.value = items.value.filter((city) => city.id !== cityId)
    delete modes.value[cityId]
  }

  function getMode(cityId) {
    return modes.value[cityId] ?? ForecastMode.DAY
  }

  function setMode(cityId, mode) {
    if (isValidMode(mode)) modes.value[cityId] = mode
  }

  watch(items, (value) => writeStorage(ITEMS_KEY, value), { deep: true })
  watch(modes, (value) => writeStorage(MODES_KEY, value), { deep: true })

  return { items, isFull, isFavorite, add, remove, getMode, setMode }
})
