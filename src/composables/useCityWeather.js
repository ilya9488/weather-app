import { computed, ref, shallowRef, toValue, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { fetchCurrentWeather, fetchForecast } from '@/api/weather'
import { toApiError } from '@/api/errors'
import { getDailyForecast, getNext24Hours, mapCurrentWeather } from '@/utils/forecast'

/**
 * Loads current weather + 5 day forecast for a city and reloads it when the
 * city or the interface language changes (API descriptions are localized).
 */
export function useCityWeather(cityRef) {
  const { locale } = storeToRefs(useSettingsStore())

  const current = shallowRef(null)
  const forecast = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)

  // Ignores responses of outdated requests (fast city switching)
  let requestId = 0

  async function load() {
    const city = toValue(cityRef)
    const id = ++requestId

    if (!city) {
      current.value = null
      forecast.value = null
      error.value = null
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      const [currentRaw, forecastRaw] = await Promise.all([
        fetchCurrentWeather(city, locale.value),
        fetchForecast(city, locale.value),
      ])
      if (id !== requestId) return
      current.value = mapCurrentWeather(currentRaw)
      forecast.value = forecastRaw
    } catch (err) {
      if (id !== requestId) return
      error.value = toApiError(err).code
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  watch([() => toValue(cityRef)?.id, locale], load, { immediate: true })

  const hourly = computed(() => (forecast.value ? getNext24Hours(forecast.value) : []))
  const daily = computed(() => (forecast.value ? getDailyForecast(forecast.value) : []))
  const timezone = computed(() => forecast.value?.city?.timezone ?? current.value?.timezone ?? 0)

  return { current, hourly, daily, timezone, loading, error, reload: load }
}
