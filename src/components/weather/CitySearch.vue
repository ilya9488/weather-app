<script setup>
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchCities } from '@/api/geocoding'
import { isCanceled, toApiError } from '@/api/errors'
import { debounce } from '@/utils/debounce'
import { getCityName, getCityRegion } from '@/utils/city'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

/** City input with autocomplete (ARIA combobox pattern, keyboard support). */
const city = defineModel('city', { type: Object, default: null })

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

const { t, locale } = useI18n()
const uid = useId()
const inputId = `${uid}-input`
const listId = `${uid}-list`
const optionId = (index) => `${uid}-option-${index}`

const query = ref(getCityName(city.value, locale.value))
const results = ref([])
const loading = ref(false)
const error = ref(null)
const searched = ref(false)
const isOpen = ref(false)
const isFocused = ref(false)
const activeIndex = ref(-1)

let controller = null

const hasResults = computed(() => results.value.length > 0)
const showPopup = computed(
  () => isOpen.value && (hasResults.value || loading.value || !!error.value || searched.value),
)
const activeDescendant = computed(() =>
  isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined,
)
const statusText = computed(() => {
  if (!isOpen.value) return ''
  if (loading.value) return t('search.loading')
  if (error.value) return t(`errors.${error.value}`)
  if (!searched.value) return ''
  return hasResults.value ? t('search.results', { count: results.value.length }) : t('search.empty')
})

function resetQuery() {
  query.value = getCityName(city.value, locale.value)
}

// Keep the input in sync with the selected city and the language
watch([city, locale], () => {
  if (!isFocused.value) resetQuery()
})

function cancelSearch() {
  debouncedSearch.cancel()
  controller?.abort()
  controller = null
}

async function runSearch(text) {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller

  try {
    const found = await searchCities(text, { signal, locale: locale.value })
    results.value = found
    error.value = null
    activeIndex.value = found.length ? 0 : -1
  } catch (err) {
    // A newer request replaced this one — it will update the state
    if (isCanceled(err) || signal.aborted) return
    results.value = []
    error.value = toApiError(err).code
    activeIndex.value = -1
  }
  searched.value = true
  loading.value = false
}

const debouncedSearch = debounce(runSearch, DEBOUNCE_MS)

function onInput() {
  const text = query.value.trim()
  searched.value = false
  error.value = null

  if (text.length < MIN_QUERY_LENGTH) {
    cancelSearch()
    results.value = []
    loading.value = false
    isOpen.value = false
    return
  }

  isOpen.value = true
  loading.value = true
  debouncedSearch(text)
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function select(item) {
  city.value = item
  query.value = getCityName(item, locale.value)
  close()
}

function moveActive(step) {
  if (!hasResults.value) return
  isOpen.value = true
  const count = results.value.length
  activeIndex.value = (activeIndex.value + step + count) % count
}

function onKeydown(event) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Enter':
      if (isOpen.value && hasResults.value) {
        event.preventDefault()
        select(results.value[Math.max(activeIndex.value, 0)])
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        close()
        resetQuery()
      }
      break
  }
}

function onFocus(event) {
  isFocused.value = true
  event.target.select()
}

function onBlur() {
  isFocused.value = false
  cancelSearch()
  loading.value = false
  close()
  resetQuery()
}

onBeforeUnmount(cancelSearch)
</script>

<template>
  <div class="search">
    <label :for="inputId" class="visually-hidden">{{ t('search.label') }}</label>
    <div class="search__field">
      <AppIcon name="search" :size="18" class="search__icon" />
      <input
        :id="inputId"
        v-model="query"
        class="search__input"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        :aria-expanded="showPopup"
        :aria-controls="listId"
        :aria-activedescendant="activeDescendant"
        :placeholder="t('search.placeholder')"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
      <BaseSpinner v-if="loading" :size="18" class="search__spinner" />
    </div>

    <div v-show="showPopup" class="search__popup">
      <ul v-show="hasResults" :id="listId" role="listbox" :aria-label="t('search.label')">
        <li
          v-for="(item, index) in results"
          :id="optionId(index)"
          :key="item.id"
          role="option"
          class="search__option"
          :class="{ 'search__option--active': index === activeIndex }"
          :aria-selected="index === activeIndex"
          @mousedown.prevent="select(item)"
          @mousemove="activeIndex = index"
        >
          <span class="search__name">{{ getCityName(item, locale) }}</span>
          <span class="search__region">{{ getCityRegion(item, locale) }}</span>
        </li>
      </ul>
      <p v-if="!hasResults && loading" class="search__message">{{ t('search.loading') }}</p>
      <p v-else-if="error" class="search__message search__message--error">
        {{ t(`errors.${error}`) }}
      </p>
      <p v-else-if="!hasResults && searched" class="search__message">{{ t('search.empty') }}</p>
    </div>

    <span class="visually-hidden" aria-live="polite">{{ statusText }}</span>
  </div>
</template>

<style scoped>
.search {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.search__field {
  position: relative;
  display: flex;
  align-items: center;
}

.search__icon {
  position: absolute;
  left: 14px;
  color: var(--muted);
  pointer-events: none;
}

.search__input {
  width: 100%;
  height: 44px;
  padding: 0 44px 0 42px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  font-size: 16px; /* prevents zoom on iOS */
  transition:
    border-color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.search__input::placeholder {
  color: var(--muted);
  opacity: 0.8;
}

.search__input:hover {
  border-color: var(--muted);
}

.search__input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search__spinner {
  position: absolute;
  right: 14px;
}

.search__popup {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.search__option {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.search__option--active {
  background: var(--accent-soft);
}

.search__name {
  font-weight: 500;
}

.search__region {
  font-size: 14px;
  color: var(--muted);
}

.search__message {
  padding: 8px 10px;
  font-size: 14px;
  color: var(--muted);
}

.search__message--error {
  color: var(--danger);
}
</style>
