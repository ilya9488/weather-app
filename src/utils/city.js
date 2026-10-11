import { formatCountry } from './format'

/**
 * A city is the unit the whole app works with (blocks, favorites, requests):
 * { id, name, localNames: { en?, uk? }, regions: { en?, uk? }, lat, lon, country, state }
 */

const COORD_PRECISION = 4
// ~5 km: results from different sources closer than this are the same place
const SAME_PLACE_DEGREES = 0.05

export function makeCityId(lat, lon) {
  return `${Number(lat).toFixed(COORD_PRECISION)},${Number(lon).toFixed(COORD_PRECISION)}`
}

function pickDefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value))
}

/** Normalizes an item from the OpenWeatherMap Geocoding API. */
export function normalizeGeoCity(raw) {
  return {
    id: makeCityId(raw.lat, raw.lon),
    name: raw.name,
    localNames: pickDefined({ en: raw.local_names?.en, uk: raw.local_names?.uk }),
    regions: {},
    lat: raw.lat,
    lon: raw.lon,
    country: raw.country ?? '',
    state: raw.state ?? '',
  }
}

/**
 * Normalizes an Open-Meteo Geocoding result. The same place requested in
 * Ukrainian and English gives localized names for both interface languages.
 */
export function normalizeOpenMeteoCity(raw, { uk, en } = {}) {
  return {
    id: makeCityId(raw.latitude, raw.longitude),
    name: en?.name ?? raw.name,
    localNames: pickDefined({ uk: uk?.name, en: en?.name }),
    regions: pickDefined({ uk: uk?.admin1, en: en?.admin1 }),
    lat: raw.latitude,
    lon: raw.longitude,
    country: raw.country_code ?? '',
    state: en?.admin1 ?? raw.admin1 ?? '',
  }
}

/** The Geocoding API may return the same place several times — keep the first one. */
export function uniqueCities(cities) {
  const seen = new Set()
  return cities.filter((city) => {
    const key = `${city.name}|${city.state}|${city.country}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isSamePlace(a, b) {
  return (
    a.country === b.country &&
    Math.abs(a.lat - b.lat) < SAME_PLACE_DEGREES &&
    Math.abs(a.lon - b.lon) < SAME_PLACE_DEGREES
  )
}

/**
 * Merges results of several sources in priority order. For duplicates the
 * first result keeps its position and data; localized names from later sources
 * are applied on top (OpenWeatherMap knows Ukrainian names of small places).
 */
export function mergeCities(...lists) {
  const merged = []
  lists.flat().forEach((city) => {
    const existing = merged.find((item) => isSamePlace(item, city))
    if (existing) {
      existing.localNames = { ...existing.localNames, ...city.localNames }
    } else {
      merged.push({ ...city, localNames: { ...city.localNames } })
    }
  })
  return merged
}

export function getCityName(city, locale) {
  if (!city) return ''
  return city.localNames?.[locale] || city.name
}

/** Secondary line for autocomplete / cards: "Київська область, Україна" */
export function getCityRegion(city, locale) {
  if (!city) return ''
  const region = city.regions?.[locale] || city.state
  return [region, formatCountry(city.country, locale)].filter(Boolean).join(', ')
}
