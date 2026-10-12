<script setup>
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ForecastMode } from '@/constants'

/** "Day / 5 days" switch built on native radio buttons (arrow keys work out of the box). */
const mode = defineModel({ type: String, required: true })

const { t } = useI18n()
const name = useId()

const options = computed(() => [
  { value: ForecastMode.DAY, label: t('mode.day') },
  { value: ForecastMode.WEEK, label: t('mode.week') },
])
</script>

<template>
  <fieldset class="mode-switch">
    <legend class="visually-hidden">{{ t('mode.label') }}</legend>
    <label
      v-for="option in options"
      :key="option.value"
      class="mode-switch__option"
      :class="{ 'mode-switch__option--active': mode === option.value }"
    >
      <input
        v-model="mode"
        class="visually-hidden"
        type="radio"
        :name="name"
        :value="option.value"
      />
      {{ option.label }}
    </label>
  </fieldset>
</template>

<style scoped>
.mode-switch {
  display: inline-flex;
  margin: 0;
  padding: 3px;
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.mode-switch__option {
  min-width: 84px;
  padding: 6px 18px;
  border-radius: var(--radius-pill);
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.mode-switch__option:hover {
  background: var(--accent-soft);
}

.mode-switch__option--active,
.mode-switch__option--active:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.mode-switch__option:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
