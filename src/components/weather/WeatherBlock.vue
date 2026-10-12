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
import DecorLeaves from '@/components/ui/DecorLeaves.vue'
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
  <div class="block-wrap">
    <DecorLeaves class="block-wrap__leaves block-wrap__leaves--top" />
    <DecorLeaves class="block-wrap__leaves block-wrap__leaves--bottom" />

    <article
      class="block glass"
      :class="{ 'block--favorite': isFavorite }"
      :aria-label="city ? t('block.label', { city: cityName }) : t('block.emptyLabel')"
      :aria-busy="loading || detecting"
    >
      <div class="block__toolbar">
        <div class="block__title">
          <CitySearch v-if="searchable" v-model:city="city" />
          <h2 v-else-if="city" class="block__city headline">{{ cityName }}</h2>
          <p v-if="city" class="block__region">{{ getCityRegion(city, locale) }}</p>
        </div>

        <div class="block__actions">
          <FavoriteButton v-if="city" :city="city" />
          <button
            v-if="removable"
            type="button"
            class="icon-btn block__remove"
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
        <span class="block__sprout"><DecorLeaves variant="sprout" /></span>
        <p>{{ notice || t('block.empty') }}</p>
      </div>

      <!-- Error without data to show -->
      <div v-else-if="error && !hasData" class="block__state block__state--error" role="alert">
        <p>{{ t(`errors.${error}`) }}</p>
        <button type="button" class="btn btn--ghost" @click="reload">
          {{ t('errors.retry') }}
        </button>
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
  </div>
</template>

<style scoped>
/* Leaves sit behind the block and peek out of two opposite corners */
.block-wrap {
  position: relative;
}

.block-wrap__leaves {
  position: absolute;
  z-index: 0;
  width: 112px;
  height: 112px;
  opacity: 0.9;
  pointer-events: none;
}

.block-wrap__leaves--top {
  top: -56px;
  right: -50px;
}

.block-wrap__leaves--bottom {
  bottom: -56px;
  left: -50px;
  transform: rotate(180deg);
}

.block {
  position: relative;
  z-index: 1;
  padding: 24px;
  border-radius: var(--radius-lg);
  transition:
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

/* The block with an open autocomplete goes above the next blocks */
.block-wrap:focus-within .block {
  z-index: 5;
}

.block--favorite {
  border-color: color-mix(in srgb, var(--accent-solid) 70%, transparent);
  box-shadow:
    0 0 0 4px var(--accent-tint),
    var(--shadow);
}

.block__toolbar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.block__title {
  flex: 1;
  min-width: 0;
}

.block__city {
  font-size: 28px;
  overflow-wrap: anywhere;
}

.block__region {
  margin-top: 4px;
  padding-left: 2px;
  color: var(--muted);
  font-size: 14px;
}

.block__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.block__content {
  display: grid;
  gap: 24px;
  margin-top: 24px;
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
  align-content: center;
  gap: 12px;
  min-height: 240px;
  margin-top: 24px;
  padding: 24px;
  border-radius: var(--radius-md);
  background: var(--fill-2);
  color: var(--muted);
  text-align: center;
}

.block__sprout {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent-tint);
}

.block__sprout svg {
  width: 52px;
  height: 52px;
}

.block__state--error {
  background: transparent;
  border: 1px solid var(--danger);
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
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

@media (max-width: 519px) {
  .block {
    padding: 16px 14px;
  }

  .block__toolbar {
    gap: 8px;
  }

  .block__city {
    font-size: 22px;
  }

  .block-wrap__leaves {
    width: 64px;
    height: 64px;
  }

  .block-wrap__leaves--top {
    top: -30px;
    right: -18px;
  }

  .block-wrap__leaves--bottom {
    bottom: -30px;
    left: -18px;
  }
}
</style>
