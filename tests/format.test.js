import { describe, expect, it } from 'vitest'
import { formatLongDate, formatTemp, formatTime } from '@/utils/format'
import {
  getCityName,
  getCityRegion,
  makeCityId,
  matchesRegion,
  rankCities,
  mergeCities,
  normalizeGeoCity,
  normalizeOpenMeteoCity,
  uniqueCities,
} from '@/utils/city'

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
      regions: {},
      districts: {},
      lat: raw.lat,
      lon: raw.lon,
      country: 'UA',
      state: 'Kyiv City',
      population: 0,
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

  it('normalizes an Open-Meteo result with names in both languages', () => {
    const base = { id: 703448, latitude: 50.45466, longitude: 30.5238, country_code: 'UA' }
    const city = normalizeOpenMeteoCity(base, {
      uk: { ...base, name: 'Київ', admin1: 'Місто Київ' },
      en: { ...base, name: 'Kyiv', admin1: 'Kyiv City' },
    })

    expect(city).toMatchObject({
      name: 'Kyiv',
      localNames: { uk: 'Київ', en: 'Kyiv' },
      regions: { uk: 'Місто Київ', en: 'Kyiv City' },
      country: 'UA',
    })
    expect(getCityRegion(city, 'uk')).toBe('Місто Київ, Україна')
  })

  it('merges sources: keeps the first result, takes local names from later ones', () => {
    const fromOpenMeteo = normalizeOpenMeteoCity(
      { latitude: 50.3715, longitude: 30.3686, country_code: 'UA', name: 'Kriukivshchyna' },
      {},
    )
    const fromOwm = normalizeGeoCity({
      name: 'Kriukivshchyna',
      local_names: { uk: 'Крюківщина' },
      lat: 50.3719,
      lon: 30.3716,
      country: 'UA',
    })
    const other = normalizeGeoCity({ ...raw })

    const merged = mergeCities([fromOpenMeteo], [fromOwm, other])

    expect(merged).toHaveLength(2)
    expect(merged[0].id).toBe(fromOpenMeteo.id)
    expect(getCityName(merged[0], 'uk')).toBe('Крюківщина')
  })
})

describe('rankCities', () => {
  const place = (name, lat, lon, population = 0) => ({ name, lat, lon, population })

  it('keeps big cities first, then the nearest places', () => {
    const ranked = rankCities(
      [
        place('far village', 46, 33, 1200),
        place('London CA', 42.98, -81.23, 420000),
        place('near village', 50.3, 30.3),
        place('London UK', 51.5, -0.12, 8900000),
      ],
      { lat: 50.4, lon: 30.5 },
    )
    expect(ranked.map((city) => city.name)).toEqual([
      'London UK',
      'London CA',
      'near village',
      'far village',
    ])
  })

  it('keeps the original order without a location', () => {
    const list = [place('a', 1, 1), place('b', 2, 2)]
    expect(rankCities(list, null).map((city) => city.name)).toEqual(['a', 'b'])
  })
})

describe('matchesRegion', () => {
  const city = {
    regions: { uk: 'Київська область', en: 'Kyiv Oblast' },
    districts: {},
    country: 'UA',
  }

  it('matches region names in any language, case-insensitive', () => {
    expect(matchesRegion(city, 'київськ')).toBe(true)
    expect(matchesRegion(city, 'kyiv')).toBe(true)
    expect(matchesRegion(city, 'Полтав')).toBe(false)
    expect(matchesRegion(city, '')).toBe(true)
  })
})
