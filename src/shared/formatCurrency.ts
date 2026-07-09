/**
 * Currency formatting helpers.
 *
 * Money is stored internally as integer minor units (e.g. cents) to avoid
 * floating-point drift. The number of minor-unit digits varies by currency
 * (USD has 2, JPY has 0), so we derive it from `Intl` rather than assuming 100.
 * Formatting only ever happens here, at the display/render boundary.
 */

const fractionDigitsCache = new Map<string, number>()

/** Returns the number of minor-unit digits for a currency (2 for USD, 0 for JPY). */
export const currencyFractionDigits = (currency: string): number => {
    const cached = fractionDigitsCache.get(currency)
    if (cached !== undefined) {
        return cached
    }
    const digits =
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
    fractionDigitsCache.set(currency, digits)
    return digits
}

/** Converts a major-unit amount (e.g. 125.5 dollars) to integer minor units (12550). */
export const toMinorUnits = (amount: number, currency: string): number => {
    const factor = 10 ** currencyFractionDigits(currency)
    return Math.round(amount * factor)
}

/** Converts integer minor units back to a major-unit number (12550 -> 125.5). */
export const toMajorUnits = (minorUnits: number, currency: string): number => {
    const factor = 10 ** currencyFractionDigits(currency)
    return minorUnits / factor
}

/**
 * Formats integer minor units as a localized currency string, e.g.
 * `formatCurrency(199900, 'USD')` -> `"$1,999.00"`.
 */
export const formatCurrency = (minorUnits: number, currency: string, locale = 'en-US'): string => {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
    return formatter.format(toMajorUnits(minorUnits, currency))
}
