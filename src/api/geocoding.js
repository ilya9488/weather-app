import { http, owmHttp } from './http'
import { ApiError, ErrorCode, toApiError } from './errors'
import {
  isSamePlace,
  matchesRegion,
  mergeCities,
  normalizeGeoCity,
  normalizeOpenMeteoCity,
  rankCities,
  uniqueCities,
} from '@/utils/city'
import { formatCountry } from '@/utils/format'
import { hasCyrillic, transliterate } from '@/utils/translit'

const OWM_LIMIT = 5 // API maximum
const OPEN_METEO_LIMIT = 50
const MAX_SUGGESTIONS = 15
const MAX_NAME_LOOKUPS = 3
const MIN_NAME_LENGTH = 2
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
// City districts and historical / abandoned places are not useful suggestions
const SKIPPED_FEATURES = new Set(['PPLX', 'PPLH', 'PPLQ', 'PPLW', 'PPLCH'])

// Finished searches: typing back and forth doesn't repeat requests
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
 * Only populated places (feature codes PPL*).
 */
async function searchOpenMeteo(query, language, signal) {
  const { data } = await http.get(OPEN_METEO_URL, {
    params: { name: query, count: OPEN_METEO_LIMIT, language, format: 'json' },
    signal,
  })
  return (data.results ?? []).filter(
    (item) => item.feature_code?.startsWith('PPL') && !SKIPPED_FEATURES.has(item.feature_code),
  )
}

const valueOf = (result) => (result.status === 'fulfilled' ? result.value : [])

function uniqueById(items) {
  const seen = new Set()
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id))
}

/** "Тарасівка, Київська" → name to search + region filter */
export function parseQuery(query) {
  const [name, ...rest] = query.split(',')
  return { name: name.trim(), region: rest.join(',').trim() }
}

function capitalizeWords(text) {
  return text.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, gap, char) => gap + char.toUpperCase())
}

/**
 * Small Ukrainian places are often known to Open-Meteo only by their Latin
 * name. If the typed Cyrillic name transliterates to it, that is the Ukrainian
 * name; otherwise ask OpenWeatherMap (for a few top results).
 */
async function addUkrainianNames(cities, typedName, signal) {
  const latinOnly = cities.filter(
    (city) => city.country === 'UA' && !hasCyrillic(city.localNames.uk),
  )
  const typedLatin = hasCyrillic(typedName) ? transliterate(typedName).toLowerCase() : null

  const lookups = []
  latinOnly.forEach((city) => {
    const latinName = (city.localNames.en ?? city.name).toLowerCase()
    if (typedLatin && latinName === typedLatin) {
      city.localNames = { ...city.localNames, uk: capitalizeWords(typedName) }
    } else if (lookups.length < MAX_NAME_LOOKUPS) {
      lookups.push(city)
    }
  })

  await Promise.allSettled(
    lookups.map(async (city) => {
      const found = await searchOwm(`${city.localNames.en ?? city.name},UA`, signal)
      const match = found.find((item) => isSamePlace(item, city))
      if (match?.localNames.uk) city.localNames = { ...city.localNames, uk: match.localNames.uk }
    }),
  )
}

/**
 * City autocomplete. OpenWeatherMap Geocoding finds a city only by its full
 * name, so suggestions by a partial name come from Open-Meteo Geocoding:
 * - the name as typed, in Ukrainian and English (localized names);
 * - for a Cyrillic name also its official transliteration, because many
 *   villages are stored only under the Latin name;
 * plus exact OpenWeatherMap matches. A failed source doesn't break the search.
 *
 * Options: `near` — { lat, lon } of the user to put the nearest of same-named
 * places first; text after a comma filters by region ("Тарасівка, Київська").
 */
export async function searchCities(query, { signal, locale = 'uk', near = null } = {}) {
  const { name, region } = parseQuery(query)
  if (name.length < MIN_NAME_LENGTH) return []

  const nearKey = near ? `${near.lat.toFixed(1)},${near.lon.toFixed(1)}` : ''
  const cacheKey = `${locale}:${name.toLowerCase()}:${region.toLowerCase()}:${nearKey}`
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)

  const latinName = hasCyrillic(name) ? transliterate(name) : null

  const [uk, en, owm, latin] = await Promise.allSettled([
    searchOpenMeteo(name, 'uk', signal),
    searchOpenMeteo(name, 'en', signal),
    searchOwm(name, signal),
    latinName ? searchOpenMeteo(latinName, 'uk', signal) : Promise.resolve([]),
  ])

  if (signal?.aborted) throw new ApiError(ErrorCode.CANCELED)
  if ([uk, en, owm].every((result) => result.status === 'rejected')) {
    throw toApiError(owm.reason)
  }

  const ukById = new Map([...valueOf(latin), ...valueOf(uk)].map((item) => [item.id, item]))
  const enById = new Map(valueOf(en).map((item) => [item.id, item]))
  const primary = locale === 'en' ? valueOf(en) : valueOf(uk)
  const fallback = locale === 'en' ? valueOf(uk) : valueOf(en)
  const found = uniqueById([...(primary.length ? primary : fallback), ...valueOf(latin)])

  const suggestions = found.map((item) =>
    normalizeOpenMeteoCity(item, { uk: ukById.get(item.id), en: enById.get(item.id) }),
  )

  const filtered = mergeCities(suggestions, valueOf(owm)).filter((city) =>
    matchesRegion(city, region, [
      formatCountry(city.country, 'uk'),
      formatCountry(city.country, 'en'),
    ]),
  )
  const cities = rankCities(filtered, near).slice(0, MAX_SUGGESTIONS)

  await addUkrainianNames(cities, name, signal)
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
