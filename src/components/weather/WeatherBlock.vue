<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavoritesStore } from '@/stores/favorites'
import { useCityWeather } from '@/composables/useCityWeather'
import { ForecastMode } from '@/constants'
import { getCityName, getCityRegion } from '@/utils/city'
import { formatShortDate, formatTime, formatWeekday, capitalize } from '@/utils/format'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import CitySearch from './CitySearch.vue'
import FavoriteButton from './FavoriteButton.vue'
import ModeSwitch from './ModeSwitch.vue'
import CurrentWeatherCard from './CurrentWeatherCard.vue'
import DailyForecast from './DailyForecast.vue'
import TemperatureChart from './TemperatureChart.vue'

/**
 * Weather block: city (searchable or fixed), favorite toggle,
 * day / 5 days switch, weather card(s) and temperature chart.
 */
defineProps({
  // Main tab: the city is picked with autocomplete; Favorites tab: fixed city
  searchable: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  // IP detection of the default city is running
  detecting: { type: Boolean, default: false },
  // Message for an empty block (e.g. IP detection failed)
  notice: { type: String, default: '' },
})

const city = defineModel('city', { type: Object, default: null })
const mode = defineModel('mode', { type: String, default: ForecastMode.DAY })

defineEmits(['remove'])

const { t, locale } = useI18n()
const favorites = useFavoritesStore()
const { current, hourly, daily, timezone, loading, error, reload } = useCityWeather(city)

const cityName = computed(() => getCityName(city.value, locale.value))
const isFavorite = computed(() => !!city.value && favorites.isFavorite(city.value.id))
const isWeek = computed(() => mode.value === ForecastMode.WEEK)
const hasData = computed(() => !!current.value)

const chart = computed(() => {
  if (isWeek.value) {
    return {
      title: t('chart.daily'),
      labels: daily.value.map((day) => [
        capitalize(formatWeekday(day.dt, day.timezone, locale.value)),
        formatShortDate(day.dt, day.timezone, locale.value),
      ]),
      values: daily.value.map((day) => day.avgTemp),
    }
  }
  return {
    title: t('chart.hourly'),
    labels: hourly.value.map((step) => formatTime(step.dt, timezone.value, locale.value)),
    values: hourly.value.map((step) => step.temp),
  }
})
</script>

<template>
  <article
    class="block"
    :class="{ 'block--favorite': isFavorite }"
    :aria-label="city ? t('block.label', { city: cityName }) : t('block.emptyLabel')"
    :aria-busy="loading || detecting"
  >
    <div class="block__toolbar">
      <CitySearch v-if="searchable" v-model:city="city" />
      <div v-else-if="city" class="block__heading">
        <h2 class="block__city">{{ cityName }}</h2>
        <p class="block__region">{{ getCityRegion(city, locale) }}</p>
      </div>

      <div class="block__actions">
        <FavoriteButton v-if="city" :city="city" />
        <button
          v-if="removable"
          type="button"
          class="icon-btn"
          :aria-label="t('block.remove')"
          :title="t('block.remove')"
          @click="$emit('remove')"
        >
          <AppIcon name="close" />
        </button>
      </div>
    </div>

    <!-- Empty / detecting states -->
    <div v-if="detecting" class="block__state">
      <BaseSpinner :size="28" :label="t('block.detecting')" />
    </div>
    <div v-else-if="!city" class="block__state">
      <p>{{ notice || t('block.empty') }}</p>
    </div>

    <!-- Error without data to show -->
    <div v-else-if="error && !hasData" class="block__state block__state--error" role="alert">
      <p>{{ t(`errors.${error}`) }}</p>
      <button type="button" class="btn btn--ghost" @click="reload">{{ t('errors.retry') }}</button>
    </div>

    <!-- First load -->
    <div v-else-if="!hasData" class="block__state">
      <BaseSpinner :size="28" :label="t('block.loading')" />
    </div>

    <template v-else>
      <div class="block__content" :class="{ 'block__content--loading': loading }">
        <ModeSwitch v-model="mode" class="block__mode" />

        <div v-if="error" class="block__inline-error" role="alert">
          <span>{{ t(`errors.${error}`) }}</span>
          <button type="button" class="btn btn--ghost" @click="reload">
            {{ t('errors.retry') }}
          </button>
        </div>

        <DailyForecast v-if="isWeek" :days="daily" />
        <CurrentWeatherCard v-else :weather="current" />

        <TemperatureChart
          class="block__chart"
          :title="chart.title"
          :labels="chart.labels"
          :values="chart.values"
        />
      </div>
      <div v-if="loading" class="block__overlay">
        <BaseSpinner :size="28" :label="t('block.loading')" />
      </div>
    </template>
  </article>
</template>

<style scoped>
.block {
  position: relative;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
  transition:
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.block--favorite {
  border-color: var(--sun);
  box-shadow:
    0 0 0 1px var(--sun),
    var(--shadow);
}

.block__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.block__heading {
  min-width: 0;
}

.block__city {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.block__region {
  color: var(--muted);
  font-size: 14px;
}

.block__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.block__content {
  display: grid;
  gap: 20px;
  margin-top: 20px;
  transition: opacity var(--dur) var(--ease);
}

.block__content--loading {
  opacity: 0.45;
}

.block__mode {
  justify-self: start;
}

.block__chart {
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.block__state {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 240px;
  margin-top: 20px;
  padding: 24px;
  border: 1px dashed var(--line);
  border-radius: var(--radius-md);
  color: var(--muted);
  text-align: center;
}

.block__state--error {
  border-color: var(--danger);
  color: var(--danger);
}

.block__inline-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 14px;
}

.block__overlay {
  position: absolute;
  inset: 84px 20px 20px;
  display: grid;
  place-items: center;
  pointer-events: none;
}

@media (max-width: 519px) {
  .block {
    padding: 14px;
  }

  .block__toolbar {
    gap: 8px;
  }
}
</style>
