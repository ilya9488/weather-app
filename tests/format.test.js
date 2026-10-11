import { describe, expect, it } from 'vitest'
import { formatLongDate, formatTemp, formatTime } from '@/utils/format'
import { getCityName, makeCityId, normalizeGeoCity, uniqueCities } from '@/utils/city'

describe('formatTemp', () => {
  it('rounds and adds the degree sign', () => {
    expect(formatTemp(14.6)).toBe('15°')
    expect(formatTemp(-3.2)).toBe('-3°')
  })

  it('never shows "-0°"', () => {
    expect(formatTemp(-0.3)).toBe('0°')
  })

  it('shows a dash for missing values', () => {
    expect(formatTemp(null)).toBe('—')
  })
})

describe('formatTime', () => {
  it('shows the time in the city time zone', () => {
    const dt = Date.UTC(2026, 9, 11, 12, 0) / 1000
    expect(formatTime(dt, 3 * 3600, 'uk')).toBe('15:00')
    expect(formatTime(dt, -5 * 3600, 'en')).toBe('07:00')
  })
})

describe('formatLongDate', () => {
  it('keeps the weekday in the nominative case', () => {
    const dt = Date.UTC(2026, 9, 11, 12, 0) / 1000
    expect(formatLongDate(dt, 0, 'uk')).toBe('Неділя, 11 жовтня')
    expect(formatLongDate(dt, 0, 'en')).toBe('Sunday, 11 October')
  })
})

describe('city helpers', () => {
  const raw = {
    name: 'Kyiv',
    local_names: { uk: 'Київ', en: 'Kyiv', de: 'Kiew' },
    lat: 50.4500336,
    lon: 30.5241361,
    country: 'UA',
    state: 'Kyiv City',
  }

  it('normalizes a geocoding item and keeps only used locales', () => {
    expect(normalizeGeoCity(raw)).toEqual({
      id: makeCityId(raw.lat, raw.lon),
      name: 'Kyiv',
      localNames: { uk: 'Київ', en: 'Kyiv' },
      lat: raw.lat,
      lon: raw.lon,
      country: 'UA',
      state: 'Kyiv City',
    })
  })

  it('returns the localized name with a fallback', () => {
    const city = normalizeGeoCity(raw)
    expect(getCityName(city, 'uk')).toBe('Київ')
    expect(getCityName({ ...city, localNames: {} }, 'uk')).toBe('Kyiv')
  })

  it('removes duplicated places', () => {
    const city = normalizeGeoCity(raw)
    const copy = normalizeGeoCity({ ...raw, lat: 50.45, lon: 30.52 })
    expect(uniqueCities([city, copy])).toHaveLength(1)
  })
})
