import { formatCountry } from './format'

/**
 * A city is the unit the whole app works with (blocks, favorites, requests):
 * { id, name, localNames: { en?, uk? }, lat, lon, country, state }
 */

const COORD_PRECISION = 4

export function makeCityId(lat, lon) {
  return `${Number(lat).toFixed(COORD_PRECISION)},${Number(lon).toFixed(COORD_PRECISION)}`
}

/** Normalizes an item from the OpenWeatherMap Geocoding API. */
export function normalizeGeoCity(raw) {
  const localNames = {}
  if (raw.local_names?.en) localNames.en = raw.local_names.en
  if (raw.local_names?.uk) localNames.uk = raw.local_names.uk

  return {
    id: makeCityId(raw.lat, raw.lon),
    name: raw.name,
    localNames,
    lat: raw.lat,
    lon: raw.lon,
    country: raw.country ?? '',
    state: raw.state ?? '',
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

export function getCityName(city, locale) {
  if (!city) return ''
  return city.localNames?.[locale] || city.name
}

/** Secondary line for autocomplete / cards: "Kyiv City, Ukraine" */
export function getCityRegion(city, locale) {
  if (!city) return ''
  return [city.state, formatCountry(city.country, locale)].filter(Boolean).join(', ')
}
