<script setup>
import { computed } from 'vue'

/**
 * Inline SVG weather icon for OpenWeatherMap icon codes
 * (https://openweathermap.org/weather-conditions). Colors follow the theme.
 * An icon is a stack of layers: sun/moon, clouds, precipitation.
 */
const props = defineProps({
  code: { type: String, required: true },
  size: { type: Number, default: 48 },
})

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4
  return {
    x1: 32 + Math.cos(angle) * 16,
    y1: 32 + Math.sin(angle) * 16,
    x2: 32 + Math.cos(angle) * 21,
    y2: 32 + Math.sin(angle) * 21,
  }
})

const layers = computed(() => {
  const condition = props.code.slice(0, 2)
  const celestial = props.code.endsWith('n') ? 'moon' : 'sun'

  switch (condition) {
    case '01':
      return [{ type: celestial }]
    case '02':
      return [
        { type: celestial, transform: 'translate(-4 -6) scale(0.8)' },
        { type: 'cloud', transform: 'translate(4 4)' },
      ]
    case '03':
      return [{ type: 'cloud' }]
    case '04':
      return [
        { type: 'cloud-back', transform: 'translate(2 -2) scale(0.85)' },
        { type: 'cloud', transform: 'translate(2 6)' },
      ]
    case '09':
      return [{ type: 'cloud', transform: 'translate(2 -4)' }, { type: 'rain' }]
    case '10':
      return [
        { type: celestial, transform: 'translate(-4 -8) scale(0.75)' },
        { type: 'cloud', transform: 'translate(2 -4)' },
        { type: 'rain' },
      ]
    case '11':
      return [{ type: 'cloud', transform: 'translate(0 -6)' }, { type: 'bolt' }]
    case '13':
      return [{ type: 'cloud', transform: 'translate(0 -6)' }, { type: 'snow' }]
    default:
      return [{ type: 'mist' }]
  }
})
</script>

<template>
  <svg
    class="weather-icon"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
  >
    <g v-for="(layer, index) in layers" :key="index" :transform="layer.transform">
      <g v-if="layer.type === 'sun'">
        <circle cx="32" cy="32" r="10" class="weather-icon__sun" />
        <line
          v-for="(ray, i) in RAYS"
          :key="i"
          v-bind="ray"
          class="weather-icon__ray"
          stroke-width="2.6"
          stroke-linecap="round"
        />
      </g>

      <path
        v-else-if="layer.type === 'moon'"
        class="weather-icon__moon"
        transform="translate(8 8) scale(2)"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />

      <g
        v-else-if="layer.type === 'cloud' || layer.type === 'cloud-back'"
        :class="layer.type === 'cloud' ? 'weather-icon__cloud' : 'weather-icon__cloud-back'"
      >
        <circle cx="24" cy="38" r="10" />
        <circle cx="36" cy="31" r="13" />
        <circle cx="46" cy="39" r="8" />
        <rect x="14" y="38" width="40" height="10" rx="5" />
      </g>

      <g
        v-else-if="layer.type === 'rain'"
        class="weather-icon__drops"
        stroke-width="2.6"
        stroke-linecap="round"
      >
        <line x1="24" y1="50" x2="21" y2="58" />
        <line x1="35" y1="50" x2="32" y2="58" />
        <line x1="46" y1="50" x2="43" y2="58" />
      </g>

      <path
        v-else-if="layer.type === 'bolt'"
        class="weather-icon__bolt"
        d="M34 40 L26 52 H33 L30 62 L41 48 H34 L37 40 Z"
      />

      <g v-else-if="layer.type === 'snow'" class="weather-icon__snow">
        <circle cx="23" cy="51" r="2.6" />
        <circle cx="34" cy="55" r="2.6" />
        <circle cx="45" cy="51" r="2.6" />
        <circle cx="28" cy="60" r="2.2" />
        <circle cx="40" cy="60" r="2.2" />
      </g>

      <g v-else class="weather-icon__mist" stroke-width="3" stroke-linecap="round">
        <line x1="12" y1="22" x2="44" y2="22" />
        <line x1="20" y1="32" x2="52" y2="32" />
        <line x1="12" y1="42" x2="44" y2="42" />
        <line x1="22" y1="52" x2="50" y2="52" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.weather-icon {
  flex-shrink: 0;
  overflow: visible;
}

.weather-icon__sun,
.weather-icon__bolt {
  fill: var(--sun);
}

.weather-icon__ray {
  stroke: var(--sun);
}

.weather-icon__moon {
  fill: var(--moon);
}

.weather-icon__cloud {
  fill: var(--cloud);
}

.weather-icon__cloud-back {
  fill: var(--cloud-2);
}

.weather-icon__drops {
  stroke: var(--rain);
}

.weather-icon__snow {
  fill: var(--rain);
}

.weather-icon__mist {
  stroke: var(--cloud-2);
}
</style>
