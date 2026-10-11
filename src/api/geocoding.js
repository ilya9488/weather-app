import { owmHttp } from './http'
import { normalizeGeoCity, uniqueCities } from '@/utils/city'

const MAX_RESULTS = 5 // API maximum

/** City autocomplete — https://openweathermap.org/api/geocoding-api */
export async function searchCities(query, { signal } = {}) {
  const { data } = await owmHttp.get('/geo/1.0/direct', {
    params: { q: query, limit: MAX_RESULTS },
    signal,
  })
  return uniqueCities(data.map(normalizeGeoCity))
}

/** Coordinates → city with localized names. */
export async function reverseGeocode(lat, lon) {
  const { data } = await owmHttp.get('/geo/1.0/reverse', {
    params: { lat, lon, limit: 1 },
  })
  return data.length ? normalizeGeoCity(data[0]) : null
}
