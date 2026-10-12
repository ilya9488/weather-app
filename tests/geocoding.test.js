import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/http', () => ({
  http: { get: vi.fn() },
  owmHttp: { get: vi.fn() },
}))

const { http, owmHttp } = await import('@/api/http')
const { searchCities, clearSearchCache, parseQuery } = await import('@/api/geocoding')

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
  clearSearchCache()
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

  it('finds a village known only by its Latin name and adds the Ukrainian name', async () => {
    const village = {
      id: 8504779,
      name: 'Kriukivshchyna',
      latitude: 50.37153,
      longitude: 30.36861,
      country_code: 'UA',
      admin1: 'Київська область',
      feature_code: 'PPL',
    }
    // Open-Meteo: nothing for Cyrillic, the village for the transliteration
    http.get.mockImplementation((_url, { params }) =>
      Promise.resolve({ data: params.name === 'Kriukivshch' ? { results: [village] } : {} }),
    )
    // OpenWeatherMap: nothing for the partial name, the village for its full Latin name
    owmHttp.get.mockImplementation((_url, { params }) =>
      Promise.resolve({
        data:
          params.q === 'Kriukivshchyna,UA'
            ? [
                {
                  name: 'Kriukivshchyna',
                  local_names: { uk: 'Крюківщина', en: 'Kriukivshchyna' },
                  lat: 50.371929,
                  lon: 30.371622,
                  country: 'UA',
                },
              ]
            : [],
      }),
    )

    const cities = await searchCities('Крюківщ', { locale: 'uk' })

    expect(cities).toHaveLength(1)
    expect(cities[0].localNames.uk).toBe('Крюківщина')
    expect(cities[0].regions.uk).toBe('Київська область')
  })

  it('reuses results for a repeated query', async () => {
    await searchCities('Харк')
    const calls = http.get.mock.calls.length
    await searchCities('харк ')
    expect(http.get.mock.calls.length).toBe(calls)
  })

  it('puts the nearest of same-named villages first and filters by region', async () => {
    const village = (id, latitude, longitude, admin1, population) => ({
      id,
      name: 'Tarasivka',
      latitude,
      longitude,
      admin1,
      admin2: 'District',
      country_code: 'UA',
      feature_code: 'PPL',
      population,
    })
    const results = [
      village(1, 46.14, 33.11, 'Херсонська область', 1114),
      village(2, 50.24, 34.34, 'Полтавська область', 1321),
      village(3, 50.34, 30.31, 'Київська область', undefined),
    ]
    http.get.mockImplementation((_url, { params }) =>
      Promise.resolve({ data: params.name === 'Tarasivka' ? { results } : {} }),
    )
    owmHttp.get.mockResolvedValue({ data: [] })
    const near = { lat: 50.37, lon: 30.36 } // Kriukivshchyna

    const ranked = await searchCities('Тарасівка', { near })
    expect(ranked.map((city) => city.regions.uk)).toEqual([
      'Київська область',
      'Полтавська область',
      'Херсонська область',
    ])
    // The Ukrainian name comes from the typed text when it transliterates to the Latin one
    expect(ranked[0].localNames.uk).toBe('Тарасівка')

    const filtered = await searchCities('Тарасівка, київськ', { near })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].regions.uk).toBe('Київська область')
  })
})

describe('parseQuery', () => {
  it('splits the name and the region', () => {
    expect(parseQuery('Тарасівка, Київська')).toEqual({ name: 'Тарасівка', region: 'Київська' })
    expect(parseQuery(' Київ ')).toEqual({ name: 'Київ', region: '' })
  })
})
