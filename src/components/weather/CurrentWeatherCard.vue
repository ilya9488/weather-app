<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { capitalize, formatLongDate, formatTemp, formatTime } from '@/utils/format'
import WeatherIcon from '@/components/ui/WeatherIcon.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

/** Weather card for the current day. */
const props = defineProps({
  weather: { type: Object, required: true },
})

const { t, locale } = useI18n()

const dateLine = computed(() => {
  const { dt, timezone } = props.weather
  return `${formatLongDate(dt, timezone, locale.value)}, ${formatTime(dt, timezone, locale.value)}`
})

const details = computed(() => {
  const w = props.weather
  const time = (value) => (value ? formatTime(value, w.timezone, locale.value) : '—')
  return [
    { key: 'feelsLike', value: formatTemp(w.feelsLike) },
    { key: 'humidity', value: `${w.humidity}%` },
    { key: 'wind', value: `${Math.round(w.windSpeed)} ${t('weather.windUnit')}` },
    { key: 'pressure', value: `${w.pressure} ${t('weather.pressureUnit')}` },
    { key: 'sunrise', value: time(w.sunrise) },
    { key: 'sunset', value: time(w.sunset) },
  ]
})
</script>

<template>
  <div class="today">
    <div class="today__main">
      <p class="today__date">
        <AppIcon name="calendar" :size="16" />
        <span
          ><span class="visually-hidden">{{ t('weather.now') }}: </span>{{ dateLine }}</span
        >
      </p>
      <div class="today__reading">
        <WeatherIcon :code="weather.icon" :size="80" />
        <p class="today__temp">{{ formatTemp(weather.temp) }}</p>
      </div>
      <p class="today__desc">{{ capitalize(weather.description) }}</p>
    </div>

    <dl class="today__details">
      <div v-for="item in details" :key="item.key" class="today__detail">
        <dt>{{ t(`weather.${item.key}`) }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.today {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 24px 40px;
  align-items: center;
}

.today__date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-tint);
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
}

.today__reading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0 4px;
}

/* Thin, large number — the iOS Weather look */
.today__temp {
  color: var(--ink);
  font-size: 96px;
  font-weight: 200;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.today__desc {
  color: var(--muted);
  font-size: 17px;
  font-weight: 500;
}

.today__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.today__detail {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--fill-2);
}

.today__detail dt {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.today__detail dd {
  margin-top: 2px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 859px) {
  .today {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 519px) {
  .today__temp {
    font-size: 76px;
  }

  .today__details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
