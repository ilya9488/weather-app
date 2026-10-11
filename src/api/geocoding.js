import { http, owmHttp } from './http'
import { ApiError, ErrorCode, toApiError } from './errors'
import {
  isSamePlace,
  mergeCities,
  normalizeGeoCity,
  normalizeOpenMeteoCity,
  uniqueCities,
} from '@/utils/city'
import { hasCyrillic, transliterate } from '@/utils/translit'

const OWM_LIMIT = 5 // API maximum
const OPEN_METEO_LIMIT = 10
const MAX_SUGGESTIONS = 6
const MAX_NAME_LOOKUPS = 3
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// Finished searches by locale + query: typing back and forth doesn't repeat requests
const searchCache = new Map()

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

const valueOf = (result) => (result.status === 'fulfilled' ? result.value : [])

function uniqueById(items) {
  const seen = new Set()
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id))
}

/**
 * Small Ukrainian places are often known to Open-Meteo only by their Latin
 * name — take the Ukrainian one from OpenWeatherMap.
 */
async function addUkrainianNames(cities, signal) {
  const targets = cities
    .filter((city) => city.country === 'UA' && !hasCyrillic(city.localNames.uk))
    .slice(0, MAX_NAME_LOOKUPS)

  await Promise.allSettled(
    targets.map(async (city) => {
      const found = await searchOwm(`${city.localNames.en ?? city.name},UA`, signal)
      const match = found.find((item) => isSamePlace(item, city))
      if (match?.localNames.uk) city.localNames = { ...city.localNames, uk: match.localNames.uk }
    }),
  )
}

/**
 * City autocomplete. OpenWeatherMap Geocoding finds a city only by its full
 * name, so suggestions by a partial name come from Open-Meteo Geocoding:
 * - the query as typed, in Ukrainian and English (localized names);
 * - for a Cyrillic query also its official transliteration, because many
 *   villages are stored only under the Latin name;
 * plus exact OpenWeatherMap matches. A failed source doesn't break the search.
 */
export async function searchCities(query, { signal, locale = 'uk' } = {}) {
  const cacheKey = `${locale}:${query.trim().toLowerCase()}`
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)

  const latinQuery = hasCyrillic(query) ? transliterate(query) : null

  const [uk, en, owm, latin] = await Promise.allSettled([
    searchOpenMeteo(query, 'uk', signal),
    searchOpenMeteo(query, 'en', signal),
    searchOwm(query, signal),
    latinQuery ? searchOpenMeteo(latinQuery, 'uk', signal) : Promise.resolve([]),
  ])

  if (signal?.aborted) throw new ApiError(ErrorCode.CANCELED)
  if ([uk, en, owm].every((result) => result.status === 'rejected')) {
    throw toApiError(owm.reason)
  }

  const ukById = new Map([...valueOf(latin), ...valueOf(uk)].map((item) => [item.id, item]))
  const enById = new Map(valueOf(en).map((item) => [item.id, item]))
  const primary = locale === 'en' ? valueOf(en) : valueOf(uk)
  const fallback = locale === 'en' ? valueOf(uk) : valueOf(en)
  const ranked = uniqueById([...(primary.length ? primary : fallback), ...valueOf(latin)])

  const suggestions = ranked.map((item) =>
    normalizeOpenMeteoCity(item, { uk: ukById.get(item.id), en: enById.get(item.id) }),
  )
  const cities = mergeCities(suggestions, valueOf(owm)).slice(0, MAX_SUGGESTIONS)

  await addUkrainianNames(cities, signal)
  if (signal?.aborted) throw new ApiError(ErrorCode.CANCELED)

  searchCache.set(cacheKey, cities)
  return cities
}

export function clearSearchCache() {
  searchCache.clear()
}

/** Coordinates → city with localized names. */
export async function reverseGeocode(lat, lon) {
  const { data } = await owmHttp.get('/geo/1.0/reverse', {
    params: { lat, lon, limit: 1 },
  })
  return data.length ? normalizeGeoCity(data[0]) : null
}
