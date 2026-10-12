import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { MAX_BLOCKS, ForecastMode } from '@/constants'
import { readStorage, writeStorage } from '@/utils/storage'
import { createId } from '@/utils/id'
import { isValidCity, isValidMode } from '@/utils/validate'
import { detectLocationByIp } from '@/api/ipLocation'
import { reverseGeocode } from '@/api/geocoding'
import { makeCityId } from '@/utils/city'

const STORAGE_KEY = 'blocks'
const LOCATION_KEY = 'userLocation'

export const DetectStatus = Object.freeze({
  IDLE: 'idle',
  PENDING: 'pending',
  DONE: 'done',
  FAILED: 'failed',
})

function createBlock(city = null) {
  return { id: createId(), city, mode: ForecastMode.DAY }
}

function restoreBlocks() {
  const saved = readStorage(STORAGE_KEY, null)
  if (!Array.isArray(saved)) return null

  const blocks = saved
    .filter((block) => block && typeof block.id === 'string')
    .slice(0, MAX_BLOCKS)
    .map((block) => ({
      id: block.id,
      city: isValidCity(block.city) ? block.city : null,
      mode: isValidMode(block.mode) ? block.mode : ForecastMode.DAY,
    }))

  return blocks.length ? blocks : null
}

function restoreLocation() {
  const saved = readStorage(LOCATION_KEY, null)
  return saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon) ? saved : null
}

/** Weather blocks on the main tab: at least 1, at most MAX_BLOCKS. */
export const useBlocksStore = defineStore('blocks', () => {
  const restored = restoreBlocks()
  const blocks = ref(restored ?? [createBlock()])
  const isFirstVisit = !restored
  const detectStatus = ref(DetectStatus.IDLE)
  // Approximate user location by IP: city search shows the nearest places first
  const userLocation = ref(restoreLocation())

  const canAdd = computed(() => blocks.value.length < MAX_BLOCKS)
  const canRemove = computed(() => blocks.value.length > 1)

  function findBlock(id) {
    return blocks.value.find((block) => block.id === id)
  }

  function addBlock() {
    if (!canAdd.value) return false
    blocks.value.push(createBlock())
    return true
  }

  function removeBlock(id) {
    if (!canRemove.value) return false
    blocks.value = blocks.value.filter((block) => block.id !== id)
    return true
  }

  function setCity(id, city) {
    const block = findBlock(id)
    if (block) block.city = city
  }

  function setMode(id, mode) {
    const block = findBlock(id)
    if (block && isValidMode(mode)) block.mode = mode
  }

  function rememberLocation({ lat, lon }) {
    userLocation.value = { lat, lon }
    writeStorage(LOCATION_KEY, userLocation.value)
  }

  /**
   * On the first visit the default block shows the user's city detected by IP.
   * Saved blocks are never overwritten; for them only the location is refreshed
   * in the background (used to rank search results).
   */
  async function detectDefaultCity() {
    if (detectStatus.value !== DetectStatus.IDLE) return
    const target = blocks.value[0]

    if (!isFirstVisit || target.city) {
      if (userLocation.value) return
      detectStatus.value = DetectStatus.DONE
      detectLocationByIp()
        .then(rememberLocation)
        .catch(() => {})
      return
    }

    detectStatus.value = DetectStatus.PENDING
    try {
      const location = await detectLocationByIp()
      rememberLocation(location)
      // Localized city names come from OWM reverse geocoding; IP data is the fallback
      const city = (await reverseGeocode(location.lat, location.lon).catch(() => null)) ?? {
        id: makeCityId(location.lat, location.lon),
        name: location.city || `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`,
        localNames: {},
        lat: location.lat,
        lon: location.lon,
        country: location.country ?? '',
        state: '',
      }
      // The user may have picked a city while detection was running
      const block = findBlock(target.id)
      if (block && !block.city) block.city = city
      detectStatus.value = DetectStatus.DONE
    } catch {
      detectStatus.value = DetectStatus.FAILED
    }
  }

  watch(blocks, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  return {
    blocks,
    detectStatus,
    userLocation,
    canAdd,
    canRemove,
    addBlock,
    removeBlock,
    setCity,
    setMode,
    detectDefaultCity,
  }
})
