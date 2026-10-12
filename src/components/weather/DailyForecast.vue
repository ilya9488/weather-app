<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { capitalize, formatShortDate, formatTemp, formatWeekday, toCityDate } from '@/utils/format'
import WeatherIcon from '@/components/ui/WeatherIcon.vue'

/** Weather cards for 5 days with the average day temperature. */
const props = defineProps({
  days: { type: Array, required: true },
})

const { t, locale } = useI18n()

const items = computed(() => {
  if (!props.days.length) return []
  const tz = props.days[0].timezone
  const today = toCityDate(Math.floor(Date.now() / 1000), tz)
    .toISOString()
    .slice(0, 10)

  return props.days.map((day) => ({
    ...day,
    isToday: day.date === today,
    name:
      day.date === today
        ? t('weather.today')
        : capitalize(formatWeekday(day.dt, day.timezone, locale.value)),
    shortDate: formatShortDate(day.dt, day.timezone, locale.value),
  }))
})
</script>

<template>
  <ol class="days">
    <li v-for="day in items" :key="day.date" class="day" :class="{ 'day--today': day.isToday }">
      <p class="day__when">
        <span class="day__name">{{ day.name }}</span>
        <span class="day__date">{{ day.shortDate }}</span>
      </p>
      <WeatherIcon :code="day.icon" :size="52" class="day__icon" />
      <p class="day__temp">
        {{ formatTemp(day.avgTemp) }}
        <span class="day__avg">{{ t('weather.avg') }}</span>
      </p>
      <p class="day__desc">{{ capitalize(day.description) }}</p>
      <p class="day__range">
        {{ t('weather.range', { min: formatTemp(day.minTemp), max: formatTemp(day.maxTemp) }) }}
      </p>
    </li>
  </ol>
</template>

<style scoped>
.days {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--fill-2);
}

.day--today {
  border-color: color-mix(in srgb, var(--accent-solid) 35%, transparent);
  background: var(--accent-tint);
}

.day__when {
  display: flex;
  flex-direction: column;
}

.day__name {
  font-weight: 600;
}

.day--today .day__name {
  color: var(--accent);
}

.day__date,
.day__avg,
.day__range,
.day__desc {
  color: var(--muted);
}

.day__date {
  font-size: 13px;
}

.day__temp {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 34px;
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.day__avg {
  font-size: 12px;
  letter-spacing: 0;
}

.day__desc {
  font-size: 14px;
  line-height: 1.3;
}

.day__range {
  margin-top: auto;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 859px) {
  .days {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .day {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px auto;
    grid-template-areas:
      'when icon temp'
      'desc range range';
    align-items: center;
    gap: 2px 12px;
    padding: 10px 14px;
  }

  .day__when {
    grid-area: when;
  }

  .day__icon {
    grid-area: icon;
    width: 44px;
    height: 44px;
  }

  .day__temp {
    grid-area: temp;
    justify-self: end;
    font-size: 28px;
  }

  .day__desc {
    grid-area: desc;
  }

  .day__range {
    grid-area: range;
    justify-self: end;
    margin-top: 0;
    white-space: nowrap;
  }
}
</style>
