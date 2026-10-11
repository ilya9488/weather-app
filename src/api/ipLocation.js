import { http } from './http'

/**
 * Free IP geolocation services without an API key (HTTPS + CORS).
 * The second one is a fallback if the first is down or blocked.
 */
const PROVIDERS = [
  {
    url: 'https://get.geojs.io/v1/ip/geo.json',
    map: (data) => ({
      lat: Number(data.latitude),
      lon: Number(data.longitude),
      city: data.city,
      country: data.country_code,
    }),
  },
  {
    url: 'https://ipapi.co/json/',
    map: (data) => ({
      lat: Number(data.latitude),
      lon: Number(data.longitude),
      city: data.city,
      country: data.country_code,
    }),
  },
]

function isValidLocation(location) {
  return Number.isFinite(location.lat) && Number.isFinite(location.lon)
}

/** Returns { lat, lon, city, country } or throws if every provider failed. */
export async function detectLocationByIp() {
  for (const provider of PROVIDERS) {
    try {
      const { data } = await http.get(provider.url)
      const location = provider.map(data)
      if (isValidLocation(location)) return location
    } catch {
      // Try the next provider
    }
  }
  throw new Error('IP geolocation failed')
}
