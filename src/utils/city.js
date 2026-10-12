import { formatCountry } from './format'

/**
 * A city is the unit the whole app works with (blocks, favorites, requests):
 * { id, name, localNames, regions, districts, lat, lon, country, state, population }
 * localNames / regions / districts are { uk?, en? }.
 */

const COORD_PRECISION = 4
// ~5 km: results from different sources closer than this are the same place
const SAME_PLACE_DEGREES = 0.05
// Big cities always go first; smaller places with the same name are sorted by distance
const BIG_CITY_POPULATION = 100_000

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
    districts: {},
    lat: raw.lat,
    lon: raw.lon,
    country: raw.country ?? '',
    state: raw.state ?? '',
    population: 0,
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
    districts: pickDefined({ uk: uk?.admin2, en: en?.admin2 }),
    lat: raw.latitude,
    lon: raw.longitude,
    country: raw.country_code ?? '',
    state: en?.admin1 ?? raw.admin1 ?? '',
    population: raw.population ?? 0,
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

export function isSamePlace(a, b) {
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

/** Approximate distance in km (equirectangular projection — fine for ranking). */
export function distanceKm(a, b) {
  const toRad = Math.PI / 180
  const x = (b.lon - a.lon) * toRad * Math.cos(((a.lat + b.lat) / 2) * toRad)
  const y = (b.lat - a.lat) * toRad
  return Math.hypot(x, y) * 6371
}

/**
 * Orders suggestions: big cities first (by population), then the rest by
 * distance from the user when it's known — among many villages with the same
 * name the nearest one is usually the one you need. Otherwise keeps the order.
 */
export function rankCities(cities, near) {
  const isBig = (city) => (city.population ?? 0) >= BIG_CITY_POPULATION

  return cities
    .map((city, index) => ({ city, index, distance: near ? distanceKm(city, near) : 0 }))
    .sort((a, b) => {
      const bigA = isBig(a.city)
      const bigB = isBig(b.city)
      if (bigA !== bigB) return bigA ? -1 : 1
      if (bigA) return b.city.population - a.city.population
      return a.distance - b.distance || a.index - b.index
    })
    .map(({ city }) => city)
}

/** "Тарасівка, Київська" — keeps places whose region, district or country matches the text. */
export function matchesRegion(city, text, countryNames = []) {
  const needle = text.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    ...Object.values(city.regions ?? {}),
    ...Object.values(city.districts ?? {}),
    city.state,
    city.country,
    ...countryNames,
  ]
  return haystack.some((value) => value?.toLowerCase().includes(needle))
}

export function getCityName(city, locale) {
  if (!city) return ''
  return city.localNames?.[locale] || city.name
}

/** Secondary line for autocomplete / cards: "Фастівський район, Київська область, Україна" */
export function getCityRegion(city, locale) {
  if (!city) return ''
  const district = city.districts?.[locale]
  const region = city.regions?.[locale] || city.state
  return [district, region, formatCountry(city.country, locale)].filter(Boolean).join(', ')
}
