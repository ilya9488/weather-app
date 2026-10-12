<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { parseQuery, searchCities } from '@/api/geocoding'
import { useBlocksStore } from '@/stores/blocks'
import { isCanceled, toApiError } from '@/api/errors'
import { debounce } from '@/utils/debounce'
import { getCityName, getCityRegion } from '@/utils/city'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

/** City input with autocomplete (ARIA combobox pattern, keyboard support). */
const city = defineModel('city', { type: Object, default: null })

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300
// With this many results, suggest narrowing by region
const REFINE_HINT_FROM = 6

const { t, locale } = useI18n()
const { userLocation } = storeToRefs(useBlocksStore())
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
const refineExample = computed(() => {
  const { name, region } = parseQuery(query.value)
  if (region || results.value.length < REFINE_HINT_FROM) return ''
  return `${name}, ${t('search.refineRegion')}`
})
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

// Keyboard navigation: keep the active option visible in the scrollable list
watch(activeIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
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
    const found = await searchCities(text, {
      signal,
      locale: locale.value,
      near: userLocation.value,
    })
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
      <AppIcon name="search" :size="19" class="search__icon" />
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
      <ul
        v-show="hasResults"
        :id="listId"
        class="search__list"
        role="listbox"
        :aria-label="t('search.label')"
      >
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
      <p v-else-if="!hasResults && searched" class="search__message">
        {{ t('search.empty') }}
        <template v-if="parseQuery(query).region">{{ t('search.emptyRegion') }}</template>
      </p>
      <p v-if="hasResults && refineExample" class="search__hint">
        {{ t('search.refine', { example: refineExample }) }}
      </p>
    </div>

    <span class="visually-hidden" aria-live="polite">{{ statusText }}</span>
  </div>
</template>

<style scoped>
.search {
  position: relative;
  width: 100%;
  max-width: 460px;
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

/* iOS-like search field; the selected city reads as the block's title */
.search__input {
  width: 100%;
  height: 46px;
  padding: 0 40px 0 42px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--ink);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.search__input::placeholder {
  color: var(--muted);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0;
  opacity: 1;
}

.search__input:focus {
  outline: none;
  border-color: var(--accent-solid);
  background: var(--surface-strong);
  box-shadow: 0 0 0 4px var(--accent-tint);
}

.search__spinner {
  position: absolute;
  right: 14px;
}

.search__popup {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 6px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--surface-popover);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  box-shadow: var(--shadow);
}

.search__list {
  max-height: min(360px, 50vh);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.search__option {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.search__option--active {
  background: var(--accent-tint);
}

.search__name {
  font-weight: 600;
}

.search__option--active .search__name {
  color: var(--accent);
}

.search__region {
  font-size: 13px;
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

.search__hint {
  margin-top: 4px;
  padding: 8px 10px 4px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 519px) {
  .search__input {
    height: 42px;
    font-size: 18px;
  }
}
</style>
