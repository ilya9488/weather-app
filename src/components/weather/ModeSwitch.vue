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
  <fieldset class="segmented">
    <legend class="visually-hidden">{{ t('mode.label') }}</legend>
    <label
      v-for="option in options"
      :key="option.value"
      class="segmented__option"
      :class="{ 'segmented__option--active': mode === option.value }"
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
