/**
 * Builds a /data/2.5/forecast response: `count` 3-hour steps starting at `startUtc`.
 * Temperature of step i is `temps[i]` (or 10 + i).
 */
export function buildForecast({ startUtc, count = 40, timezone = 0, temps = [] } = {}) {
  const start = Math.floor(new Date(startUtc).getTime() / 1000)

  const list = Array.from({ length: count }, (_, i) => {
    const dt = start + i * 3 * 3600
    const localHour = new Date((dt + timezone) * 1000).getUTCHours()
    const pod = localHour >= 6 && localHour < 21 ? 'd' : 'n'
    const temp = temps[i] ?? 10 + i
    return {
      dt,
      main: { temp, feels_like: temp - 1, temp_min: temp - 0.5, temp_max: temp + 0.5 },
      weather: [{ id: 800, main: 'Clear', description: `sky ${pod}`, icon: `01${pod}` }],
      sys: { pod },
      dt_txt: new Date(dt * 1000).toISOString(),
    }
  })

  return { cod: '200', cnt: count, list, city: { name: 'Test', timezone } }
}
