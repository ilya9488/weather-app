<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { capitalize, formatLongDate, formatTemp, formatTime } from '@/utils/format'
import WeatherIcon from '@/components/ui/WeatherIcon.vue'

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
        <span class="today__now">{{ t('weather.now') }}</span>
        {{ dateLine }}
      </p>
      <div class="today__reading">
        <WeatherIcon :code="weather.icon" :size="84" />
        <p class="today__temp">{{ formatTemp(weather.temp) }}<span class="today__unit">C</span></p>
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  color: var(--muted);
  font-size: 14px;
}

.today__now {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.today__reading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 4px;
}

.today__temp {
  font-family: var(--font-display);
  font-size: 76px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.today__unit {
  margin-left: 2px;
  font-size: 0.42em;
  font-weight: 400;
  letter-spacing: 0;
  vertical-align: 0.9em;
  color: var(--muted);
}

.today__desc {
  font-size: 18px;
  font-weight: 500;
}

.today__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--line);
}

.today__detail {
  padding: 12px 14px;
  background: var(--surface);
}

.today__detail dt {
  color: var(--muted);
  font-size: 13px;
}

.today__detail dd {
  margin-top: 2px;
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 859px) {
  .today {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 519px) {
  .today__temp {
    font-size: 60px;
  }

  .today__details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
