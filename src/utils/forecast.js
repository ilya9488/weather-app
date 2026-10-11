import { toCityDate } from './format'

/** Number of 3-hour steps in 24 hours. */
export const STEPS_PER_DAY = 8
export const FORECAST_DAYS = 5

/** Current weather from /data/2.5/weather → view model. */
export function mapCurrentWeather(raw) {
  const weather = raw.weather?.[0] ?? {}
  return {
    dt: raw.dt,
    timezone: raw.timezone ?? 0,
    temp: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    windSpeed: raw.wind?.speed ?? 0,
    description: weather.description ?? '',
    icon: weather.icon ?? '01d',
    sunrise: raw.sys?.sunrise ?? null,
    sunset: raw.sys?.sunset ?? null,
  }
}

/** Temperature for the next 24 hours (8 × 3-hour steps) from /data/2.5/forecast. */
export function getNext24Hours(forecast) {
  return forecast.list.slice(0, STEPS_PER_DAY).map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    icon: item.weather?.[0]?.icon ?? '01d',
  }))
}

function cityDateKey(unixSeconds, tzOffsetSeconds) {
  return toCityDate(unixSeconds, tzOffsetSeconds).toISOString().slice(0, 10)
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Most frequent value; on a tie the earliest one wins. */
function mostFrequent(values) {
  const counts = new Map()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  let best = values[0]
  counts.forEach((count, value) => {
    if (count > counts.get(best)) best = value
  })
  return best
}

/**
 * Groups 3-hour steps by the city's local calendar day and returns the first
 * `days` days. Day temperature is the average of all steps of that day.
 */
export function getDailyForecast(forecast, days = FORECAST_DAYS) {
  const tz = forecast.city?.timezone ?? 0
  const groups = new Map()

  forecast.list.forEach((item) => {
    const key = cityDateKey(item.dt, tz)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })

  return [...groups.entries()].slice(0, days).map(([date, items]) => {
    // Prefer daytime conditions for the day's icon/description
    const daytime = items.filter((item) => item.sys?.pod === 'd')
    const source = daytime.length ? daytime : items
    const icon = mostFrequent(source.map((item) => item.weather?.[0]?.icon ?? '01d'))
    const representative = source.find((item) => item.weather?.[0]?.icon === icon)

    return {
      date,
      dt: items[0].dt,
      timezone: tz,
      avgTemp: Math.round(average(items.map((item) => item.main.temp)) * 10) / 10,
      minTemp: Math.min(...items.map((item) => item.main.temp_min ?? item.main.temp)),
      maxTemp: Math.max(...items.map((item) => item.main.temp_max ?? item.main.temp)),
      icon,
      description: representative?.weather?.[0]?.description ?? '',
    }
  })
}
