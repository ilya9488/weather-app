import axios from 'axios'
import { ApiError, ErrorCode, toApiError } from './errors'

const API_KEY = import.meta.env.VITE_OWM_API_KEY

/** Axios instance for OpenWeatherMap: base URL, API key and unified errors. */
export const owmHttp = axios.create({
  baseURL: 'https://api.openweathermap.org',
  timeout: 10000,
})

owmHttp.interceptors.request.use((config) => {
  if (!API_KEY) throw new ApiError(ErrorCode.NO_KEY)
  config.params = { ...config.params, appid: API_KEY }
  return config
})

owmHttp.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

/** Plain instance for third-party services (IP geolocation). */
export const http = axios.create({ timeout: 6000 })
