import { owmHttp } from './http'

const CACHE_TTL = 10 * 60 * 1000 // OpenWeatherMap updates data roughly every 10 minutes
const cache = new Map()

/**
 * GET with an in-memory cache. Concurrent calls with the same key share one
 * request (e.g. the same city on the main page and in favorites).
 */
function cachedGet(url, params) {
  const key = `${url}?${new URLSearchParams(params)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.time < CACHE_TTL) return hit.promise

  const promise = owmHttp.get(url, { params }).then(({ data }) => data)
  cache.set(key, { time: Date.now(), promise })
  // Don't keep failed requests in the cache
  promise.catch(() => cache.delete(key))
  return promise
}

function baseParams({ lat, lon }, lang) {
  return { lat, lon, units: 'metric', lang }
}

/** https://openweathermap.org/current */
export function fetchCurrentWeather(city, lang) {
  return cachedGet('/data/2.5/weather', baseParams(city, lang))
}

/** 5 day / 3 hour forecast — https://openweathermap.org/forecast5 */
export function fetchForecast(city, lang) {
  return cachedGet('/data/2.5/forecast', baseParams(city, lang))
}

export function clearWeatherCache() {
  cache.clear()
}
