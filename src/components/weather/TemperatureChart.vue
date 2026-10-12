<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useSettingsStore } from '@/stores/settings'
import { formatTemp } from '@/utils/format'

// Register only what the line chart needs (keeps the bundle small)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
)

/** Temperature line chart on plain Chart.js (no vue-chartjs wrapper). */
const props = defineProps({
  // Each label is a string or an array of lines
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  title: { type: String, required: true },
})

const { t } = useI18n()
const { theme } = storeToRefs(useSettingsStore())
const canvas = ref(null)
// Chart instance must not be reactive: Vue proxies break Chart.js internals
let chart = null

const tableRows = computed(() =>
  props.labels.map((label, index) => ({
    label: Array.isArray(label) ? label.join(' ') : label,
    value: formatTemp(props.values[index]),
  })),
)

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readColors() {
  return {
    line: cssVar('--chart-line'),
    fill: cssVar('--chart-fill'),
    fillEnd: cssVar('--chart-fill-end'),
    grid: cssVar('--chart-grid'),
    ink: cssVar('--ink'),
    muted: cssVar('--muted'),
    surface: cssVar('--surface-strong'),
    tooltipBg: cssVar('--tooltip'),
    tooltipInk: cssVar('--tooltip-ink'),
  }
}

/** Vertical guide line under the hovered point. */
const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw(instance) {
    const active = instance.tooltip?.getActiveElements?.() ?? []
    if (!active.length) return
    const { ctx, chartArea } = instance
    const x = active[0].element.x
    ctx.save()
    ctx.strokeStyle = instance.options.plugins.crosshair.color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

/** Direct labels only on the minimum and maximum points; the rest is in the tooltip. */
const extremesLabelPlugin = {
  id: 'extremesLabel',
  afterDatasetsDraw(instance) {
    const values = instance.data.datasets[0]?.data ?? []
    if (values.length < 2) return
    const max = values.indexOf(Math.max(...values))
    const min = values.indexOf(Math.min(...values))
    const points = instance.getDatasetMeta(0).data
    const { ctx } = instance
    const { color, font } = instance.options.plugins.extremesLabel

    ctx.save()
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'center'
    new Set([max, min]).forEach((index) => {
      const point = points[index]
      if (!point) return
      const above = index === max
      ctx.textBaseline = above ? 'bottom' : 'top'
      ctx.fillText(formatTemp(values[index]), point.x, point.y + (above ? -10 : 10))
    })
    ctx.restore()
  },
}

function createGradient(context, fill, fillEnd) {
  const { ctx, chartArea } = context.chart
  if (!chartArea) return fill
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0, fill)
  // Fade to the same hue (fading to transparent black would look grey)
  gradient.addColorStop(1, fillEnd)
  return gradient
}

function buildOptions(colors) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const font = { family: getComputedStyle(document.body).fontFamily, size: 12 }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 24, bottom: 4, left: 4, right: 12 } },
    scales: {
      x: {
        grid: { display: false },
        border: { color: colors.grid },
        ticks: { color: colors.muted, font, maxRotation: 0, autoSkipPadding: 12 },
      },
      y: {
        // Room above the max and below the min for the direct labels
        afterDataLimits: (scale) => {
          const range = scale.max - scale.min || 4
          scale.max += range * 0.2
          scale.min -= range * 0.3
        },
        grid: { color: colors.grid },
        border: { display: false },
        ticks: { color: colors.muted, font, maxTicksLimit: 5, callback: (v) => `${v}°` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipInk,
        bodyColor: colors.tooltipInk,
        titleFont: { ...font, weight: '600' },
        bodyFont: font,
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const label = props.labels[items[0]?.dataIndex] ?? ''
            return Array.isArray(label) ? label.join(', ') : label
          },
          label: (item) => `${t('chart.temperature')}: ${formatTemp(item.parsed.y)}C`,
        },
      },
      crosshair: { color: colors.grid },
      extremesLabel: { color: colors.ink, font: `600 13px ${font.family}` },
    },
  }
}

function buildDataset(colors) {
  return {
    data: [...props.values],
    borderColor: colors.line,
    borderWidth: 2,
    tension: 0.35,
    fill: true,
    backgroundColor: (context) => createGradient(context, colors.fill, colors.fillEnd),
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: colors.line,
    pointBorderColor: colors.surface,
    pointBorderWidth: 1.5,
    pointHitRadius: 16,
  }
}

function render() {
  const colors = readColors()
  if (!chart) {
    chart = new Chart(canvas.value, {
      type: 'line',
      data: { labels: [...props.labels], datasets: [buildDataset(colors)] },
      options: buildOptions(colors),
      plugins: [crosshairPlugin, extremesLabelPlugin],
    })
    return
  }
  chart.data.labels = [...props.labels]
  chart.data.datasets[0] = buildDataset(colors)
  chart.options = buildOptions(colors)
  chart.update()
}

onMounted(() => {
  render()
  // Canvas text doesn't re-render when the web font arrives — redraw once it's ready
  document.fonts?.ready.then(() => chart && render())
})

watch(() => [props.labels, props.values], render, { deep: true })
watch(theme, render, { flush: 'post' })

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <figure class="chart">
    <figcaption class="chart__title">{{ title }}</figcaption>
    <div class="chart__canvas">
      <canvas ref="canvas" role="img" :aria-label="title" />
    </div>
    <table class="visually-hidden">
      <caption>
        {{
          title
        }}
      </caption>
      <tbody>
        <tr v-for="row in tableRows" :key="row.label">
          <th scope="row">{{ row.label }}</th>
          <td>{{ row.value }}C</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}

.chart__title {
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.chart__canvas {
  position: relative;
  height: 240px;
}

@media (max-width: 519px) {
  .chart__canvas {
    height: 200px;
  }
}
</style>
