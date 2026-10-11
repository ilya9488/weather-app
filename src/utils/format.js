/**
 * Formatting helpers. OpenWeatherMap returns UTC timestamps and the city's
 * UTC offset in seconds, so dates are shifted by the offset and formatted in UTC —
 * this shows the city's local time regardless of the user's own time zone.
 */

const INTL_LOCALES = { uk: 'uk-UA', en: 'en-GB' }

export function toIntlLocale(locale) {
  return INTL_LOCALES[locale] ?? INTL_LOCALES.en
}

export function toCityDate(unixSeconds, tzOffsetSeconds = 0) {
  return new Date((unixSeconds + tzOffsetSeconds) * 1000)
}

export function formatTemp(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value)
  // Avoid "-0°"
  return `${rounded === 0 ? 0 : rounded}°`
}

export function formatTime(unixSeconds, tzOffsetSeconds, locale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(toCityDate(unixSeconds, tzOffsetSeconds))
}

/** "Неділя, 11 жовтня" — weekday is formatted on its own to keep the nominative case. */
export function formatLongDate(unixSeconds, tzOffsetSeconds, locale) {
  const date = toCityDate(unixSeconds, tzOffsetSeconds)
  const intlLocale = toIntlLocale(locale)
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: 'long', timeZone: 'UTC' }).format(
    date,
  )
  const dayMonth = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date)
  return `${capitalize(weekday)}, ${dayMonth}`
}

export function formatWeekday(unixSeconds, tzOffsetSeconds, locale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(toCityDate(unixSeconds, tzOffsetSeconds))
}

export function formatShortDate(unixSeconds, tzOffsetSeconds, locale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(toCityDate(unixSeconds, tzOffsetSeconds))
}

/** "UA" → "Україна" / "Ukraine" */
export function formatCountry(code, locale) {
  if (!code) return ''
  try {
    return new Intl.DisplayNames([toIntlLocale(locale)], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function capitalize(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
