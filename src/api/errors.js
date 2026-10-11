import axios from 'axios'

export const ErrorCode = Object.freeze({
  NO_KEY: 'NO_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT: 'RATE_LIMIT',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK: 'NETWORK',
  CANCELED: 'CANCELED',
  UNKNOWN: 'UNKNOWN',
})

export class ApiError extends Error {
  constructor(code, message) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
  }
}

/** Converts any thrown value (axios error, ApiError, etc.) to an ApiError. */
export function toApiError(error) {
  if (error instanceof ApiError) return error
  if (axios.isCancel(error)) return new ApiError(ErrorCode.CANCELED)

  const status = error?.response?.status
  if (status === 401) return new ApiError(ErrorCode.UNAUTHORIZED)
  if (status === 404) return new ApiError(ErrorCode.NOT_FOUND)
  if (status === 429) return new ApiError(ErrorCode.RATE_LIMIT)
  if (!error?.response) return new ApiError(ErrorCode.NETWORK, error?.message)

  return new ApiError(ErrorCode.UNKNOWN, error?.message)
}

export function isCanceled(error) {
  return error?.code === ErrorCode.CANCELED
}
