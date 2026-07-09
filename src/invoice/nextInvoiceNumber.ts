/**
 * Suggests the next invoice number by incrementing the last run of digits in the
 * previous one, preserving any prefix, zero-padding, and trailing suffix:
 *
 *   nextInvoiceNumber('INV-2026-001', '2026') -> 'INV-2026-002'
 *   nextInvoiceNumber('INV-2026-099', '2026') -> 'INV-2026-100'
 *   nextInvoiceNumber('2026-007-DRAFT', ...)  -> '2026-008-DRAFT'
 *
 * Falls back to `INV-<year>-001` when there's no previous number, and returns the
 * previous value unchanged when it contains no digits to increment.
 */
export const nextInvoiceNumber = (previous: string | undefined, year: string): string => {
    const fallback = `INV-${year}-001`
    if (!previous) {
        return fallback
    }
    const match = /^(.*?)(\d+)(\D*)$/.exec(previous)
    const [, prefix = '', digits, suffix = ''] = match ?? []
    if (digits === undefined) {
        return previous
    }
    const incremented = String(Number(digits) + 1).padStart(digits.length, '0')
    return `${prefix}${incremented}${suffix}`
}
