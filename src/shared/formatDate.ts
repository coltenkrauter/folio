/**
 * Date helpers. Invoice dates are stored as plain `YYYY-MM-DD` strings so the
 * JSON stays portable and timezone-free. We parse them as UTC to avoid the
 * classic "off by one day" bug when the host is west of UTC.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** True when a string is a valid `YYYY-MM-DD` calendar date. */
export const isIsoDate = (value: string): boolean => {
    if (!ISO_DATE.test(value)) {
        return false
    }
    const [year, month, day] = value.split('-').map(Number) as [number, number, number]
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Returns today's date as a `YYYY-MM-DD` string in the host timezone. */
export const todayIso = (now: Date = new Date()): string => {
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/** Returns a `YYYY-MM-DD` string `days` from `fromIso` (default today). */
export const addDaysIso = (days: number, fromIso: string = todayIso()): string => {
    const [year, month, day] = fromIso.split('-').map(Number) as [number, number, number]
    const date = new Date(Date.UTC(year, month - 1, day))
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

/**
 * Formats a `YYYY-MM-DD` string for display, e.g. `"2026-07-09"` ->
 * `"July 9, 2026"`. Returns the raw input unchanged if it is not a valid date.
 */
export const formatDate = (isoDate: string, locale = 'en-US'): string => {
    if (!isIsoDate(isoDate)) {
        return isoDate
    }
    const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number]
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date)
}
