/**
 * Safe localStorage wrapper: never throws (private mode, quota, disabled storage)
 * and (de)serializes values as JSON.
 */
const PREFIX = 'weather:'

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage is unavailable — the app keeps working with in-memory state.
  }
}
