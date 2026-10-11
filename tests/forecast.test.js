import { describe, expect, it } from 'vitest'
import { getDailyForecast, getNext24Hours, mapCurrentWeather } from '@/utils/forecast'
import { buildForecast } from './fixtures/forecast'

describe('getNext24Hours', () => {
  it('returns the first 8 three-hour steps', () => {
    const forecast = buildForecast({ startUtc: '2026-10-11T12:00:00Z' })
    const hours = getNext24Hours(forecast)

    expect(hours).toHaveLength(8)
    expect(hours[0]).toMatchObject({ temp: 10, icon: '01d' })
    expect(hours[7].dt - hours[0].dt).toBe(21 * 3600)
  })
})

describe('getDailyForecast', () => {
  it('groups steps by local day and averages the temperature', () => {
    // 00:00 UTC start, UTC city → 8 steps per day
    const temps = [0, 2, 4, 6, 8, 10, 12, 14, ...Array(32).fill(5)]
    const days = getDailyForecast(buildForecast({ startUtc: '2026-10-11T00:00:00Z', temps }))

    expect(days).toHaveLength(5)
    expect(days[0].date).toBe('2026-10-11')
    expect(days[0].avgTemp).toBe(7)
    expect(days[0].minTemp).toBe(-0.5)
    expect(days[0].maxTemp).toBe(14.5)
    expect(days[1].avgTemp).toBe(5)
  })

  it('uses the city time zone to split days', () => {
    // 21:00 UTC is already 00:00 next day in UTC+3
    const forecast = buildForecast({ startUtc: '2026-10-11T21:00:00Z', timezone: 3 * 3600 })
    const days = getDailyForecast(forecast)

    expect(days[0].date).toBe('2026-10-12')
  })

  it('keeps only the first 5 days of a partial-day forecast', () => {
    // Starting mid-day gives 6 calendar days in 40 steps
    const days = getDailyForecast(buildForecast({ startUtc: '2026-10-11T15:00:00Z' }))

    expect(days).toHaveLength(5)
    expect(days.map((day) => day.date)).toEqual([
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
    ])
  })

  it('prefers daytime conditions for the day icon', () => {
    const days = getDailyForecast(buildForecast({ startUtc: '2026-10-11T00:00:00Z' }))
    expect(days[0].icon).toBe('01d')
  })
})

describe('mapCurrentWeather', () => {
  it('maps the API response to the card model', () => {
    const weather = mapCurrentWeather({
      dt: 1760180400,
      timezone: 10800,
      main: { temp: 14.6, feels_like: 13.2, humidity: 71, pressure: 1016 },
      wind: { speed: 3.4 },
      weather: [{ description: 'хмарно', icon: '04d' }],
      sys: { sunrise: 1760155000, sunset: 1760195000 },
    })

    expect(weather).toMatchObject({
      temp: 14.6,
      feelsLike: 13.2,
      humidity: 71,
      pressure: 1016,
      windSpeed: 3.4,
      description: 'хмарно',
      icon: '04d',
      timezone: 10800,
    })
  })
})
