import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/http', () => ({
  http: { get: vi.fn() },
  owmHttp: { get: vi.fn() },
}))

const { http, owmHttp } = await import('@/api/http')
const { searchCities } = await import('@/api/geocoding')

const kharkiv = { id: 706483, latitude: 49.98, longitude: 36.25, country_code: 'UA' }
const district = {
  id: 1,
  latitude: 49.9,
  longitude: 36.3,
  country_code: 'UA',
  feature_code: 'ADM2',
}

function openMeteo(language) {
  const names = { uk: 'Харків', en: 'Kharkiv' }
  return {
    data: {
      results: [
        { ...kharkiv, feature_code: 'PPLA', name: names[language], admin1: `${language} region` },
        { ...district, name: 'District' },
      ],
    },
  }
}

const owmVillage = {
  name: 'Kharkivka',
  local_names: { uk: 'Харківка' },
  lat: 49.01,
  lon: 30.3,
  country: 'UA',
}

beforeEach(() => {
  vi.resetAllMocks()
  http.get.mockImplementation((_url, { params }) => Promise.resolve(openMeteo(params.language)))
  owmHttp.get.mockResolvedValue({ data: [owmVillage] })
})

describe('searchCities', () => {
  it('ranks partial-name suggestions first and adds exact OpenWeatherMap matches', async () => {
    const cities = await searchCities('Харк', { locale: 'uk' })

    expect(cities.map((city) => city.localNames.uk)).toEqual(['Харків', 'Харківка'])
    expect(cities[0].localNames).toEqual({ uk: 'Харків', en: 'Kharkiv' })
  })

  it('skips non-populated places', async () => {
    const cities = await searchCities('Харк')
    expect(cities.some((city) => city.name === 'District')).toBe(false)
  })

  it('still returns OpenWeatherMap results when Open-Meteo fails', async () => {
    http.get.mockRejectedValue(new Error('blocked'))
    const cities = await searchCities('Харківка')
    expect(cities).toHaveLength(1)
    expect(cities[0].name).toBe('Kharkivka')
  })

  it('throws the OpenWeatherMap error when every source fails', async () => {
    http.get.mockRejectedValue(new Error('blocked'))
    owmHttp.get.mockRejectedValue({ response: { status: 401 } })
    await expect(searchCities('Харк')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
