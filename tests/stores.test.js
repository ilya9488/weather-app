import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { MAX_BLOCKS, MAX_FAVORITES, ForecastMode } from '@/constants'

vi.mock('@/api/ipLocation', () => ({
  detectLocationByIp: vi.fn(),
}))
vi.mock('@/api/geocoding', () => ({
  reverseGeocode: vi.fn(),
}))

const { detectLocationByIp } = await import('@/api/ipLocation')
const { reverseGeocode } = await import('@/api/geocoding')
const { useFavoritesStore } = await import('@/stores/favorites')
const { useBlocksStore, DetectStatus } = await import('@/stores/blocks')

function city(id) {
  const [lat, lon] = id.split(',').map(Number)
  return { id, name: `City ${id}`, localNames: {}, lat, lon, country: 'UA', state: '' }
}

const cities = Array.from({ length: 6 }, (_, i) => city(`${i}.0000,${i}.0000`))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('favorites store', () => {
  it(`allows at most ${MAX_FAVORITES} cities`, () => {
    const store = useFavoritesStore()
    cities.slice(0, MAX_FAVORITES).forEach((item) => expect(store.add(item)).toBe(true))

    expect(store.add(cities[MAX_FAVORITES])).toBe(false)
    expect(store.items).toHaveLength(MAX_FAVORITES)
    expect(store.isFull).toBe(true)
  })

  it('does not add the same city twice', () => {
    const store = useFavoritesStore()
    store.add(cities[0])
    store.add(cities[0])
    expect(store.items).toHaveLength(1)
  })

  it('persists cities and modes in localStorage', async () => {
    const store = useFavoritesStore()
    store.add(cities[0])
    store.setMode(cities[0].id, ForecastMode.WEEK)
    await nextTick()

    setActivePinia(createPinia())
    const restored = useFavoritesStore()
    expect(restored.items).toEqual([cities[0]])
    expect(restored.getMode(cities[0].id)).toBe(ForecastMode.WEEK)
  })

  it('ignores broken data in localStorage', () => {
    localStorage.setItem('weather:favorites', JSON.stringify([{ foo: 1 }, cities[1]]))
    expect(useFavoritesStore().items).toEqual([cities[1]])
  })

  it('removes a city with its mode', () => {
    const store = useFavoritesStore()
    store.add(cities[0])
    store.setMode(cities[0].id, ForecastMode.WEEK)
    store.remove(cities[0].id)

    expect(store.isFavorite(cities[0].id)).toBe(false)
    expect(store.getMode(cities[0].id)).toBe(ForecastMode.DAY)
  })
})

describe('blocks store', () => {
  it('starts with one empty block', () => {
    const store = useBlocksStore()
    expect(store.blocks).toHaveLength(1)
    expect(store.blocks[0]).toMatchObject({ city: null, mode: ForecastMode.DAY })
  })

  it(`allows 1 to ${MAX_BLOCKS} blocks`, () => {
    const store = useBlocksStore()
    expect(store.removeBlock(store.blocks[0].id)).toBe(false)

    for (let i = 1; i < MAX_BLOCKS; i++) expect(store.addBlock()).toBe(true)
    expect(store.addBlock()).toBe(false)
    expect(store.blocks).toHaveLength(MAX_BLOCKS)

    expect(store.removeBlock(store.blocks[2].id)).toBe(true)
    expect(store.blocks).toHaveLength(MAX_BLOCKS - 1)
  })

  it('restores blocks with cities and modes after reload', async () => {
    const store = useBlocksStore()
    store.setCity(store.blocks[0].id, cities[0])
    store.addBlock()
    store.setMode(store.blocks[1].id, ForecastMode.WEEK)
    await nextTick()

    setActivePinia(createPinia())
    const restored = useBlocksStore()
    expect(restored.blocks).toHaveLength(2)
    expect(restored.blocks[0].city).toEqual(cities[0])
    expect(restored.blocks[1]).toMatchObject({ city: null, mode: ForecastMode.WEEK })
  })

  it('detects the default city by IP on the first visit', async () => {
    detectLocationByIp.mockResolvedValue({ lat: 1, lon: 1, city: 'X', country: 'UA' })
    reverseGeocode.mockResolvedValue(cities[1])

    const store = useBlocksStore()
    await store.detectDefaultCity()

    expect(store.detectStatus).toBe(DetectStatus.DONE)
    expect(store.blocks[0].city).toEqual(cities[1])
  })

  it('does not overwrite saved blocks with the IP city', async () => {
    localStorage.setItem(
      'weather:blocks',
      JSON.stringify([{ id: 'a', city: cities[0], mode: ForecastMode.DAY }]),
    )
    const store = useBlocksStore()
    await store.detectDefaultCity()

    expect(detectLocationByIp).not.toHaveBeenCalled()
    expect(store.blocks[0].city).toEqual(cities[0])
  })

  it('keeps the block empty when IP detection fails', async () => {
    detectLocationByIp.mockRejectedValue(new Error('offline'))
    const store = useBlocksStore()
    await store.detectDefaultCity()

    expect(store.detectStatus).toBe(DetectStatus.FAILED)
    expect(store.blocks[0].city).toBeNull()
  })
})
