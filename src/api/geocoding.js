import { http, owmHttp } from './http'
import { ApiError, ErrorCode, toApiError } from './errors'
import { mergeCities, normalizeGeoCity, normalizeOpenMeteoCity, uniqueCities } from '@/utils/city'

const OWM_LIMIT = 5 // API maximum
const OPEN_METEO_LIMIT = 10
const MAX_SUGGESTIONS = 6
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

/** Exact name match — https://openweathermap.org/api/geocoding-api */
async function searchOwm(query, signal) {
  const { data } = await owmHttp.get('/geo/1.0/direct', {
    params: { q: query, limit: OWM_LIMIT },
    signal,
  })
  return uniqueCities(data.map(normalizeGeoCity))
}

/**
 * Search by the beginning of a name, ranked by population — https://open-meteo.com/en/docs/geocoding-api
 * Only populated places (feature codes PPL*), no regions or airports.
 */
async function searchOpenMeteo(query, language, signal) {
  const { data } = await http.get(OPEN_METEO_URL, {
    params: { name: query, count: OPEN_METEO_LIMIT, language, format: 'json' },
    signal,
  })
  return (data.results ?? []).filter((item) => item.feature_code?.startsWith('PPL'))
}

/**
 * City autocomplete. OpenWeatherMap Geocoding finds a city only by its full
 * name, so suggestions by a partial name come from Open-Meteo Geocoding and
 * exact OpenWeatherMap matches are added (they also cover villages that have
 * no Ukrainian name in Open-Meteo). A failed source doesn't break the search.
 */
export async function searchCities(query, { signal, locale = 'uk' } = {}) {
  const [uk, en, owm] = await Promise.allSettled([
    searchOpenMeteo(query, 'uk', signal),
    searchOpenMeteo(query, 'en', signal),
    searchOwm(query, signal),
  ])

  if (signal?.aborted) throw new ApiError(ErrorCode.CANCELED)
  if ([uk, en, owm].every((result) => result.status === 'rejected')) {
    throw toApiError(owm.reason)
  }

  const value = (result) => (result.status === 'fulfilled' ? result.value : [])
  const ukById = new Map(value(uk).map((item) => [item.id, item]))
  const enById = new Map(value(en).map((item) => [item.id, item]))
  const ranked = value(locale === 'en' ? en : uk).length
    ? value(locale === 'en' ? en : uk)
    : value(locale === 'en' ? uk : en)

  const suggestions = ranked.map((item) =>
    normalizeOpenMeteoCity(item, { uk: ukById.get(item.id), en: enById.get(item.id) }),
  )

  return mergeCities(suggestions, value(owm)).slice(0, MAX_SUGGESTIONS)
}

/** Coordinates → city with localized names. */
export async function reverseGeocode(lat, lon) {
  const { data } = await owmHttp.get('/geo/1.0/reverse', {
    params: { lat, lon, limit: 1 },
  })
  return data.length ? normalizeGeoCity(data[0]) : null
}
