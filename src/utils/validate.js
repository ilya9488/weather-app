import { ForecastMode } from '@/constants'

/** Guards against broken or outdated data restored from localStorage. */

export function isValidCity(city) {
  return (
    !!city &&
    typeof city === 'object' &&
    typeof city.id === 'string' &&
    typeof city.name === 'string' &&
    Number.isFinite(city.lat) &&
    Number.isFinite(city.lon)
  )
}

export function isValidMode(mode) {
  return Object.values(ForecastMode).includes(mode)
}
