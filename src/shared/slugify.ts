/**
 * Turns arbitrary text into a filesystem-safe, lowercase, hyphenated slug.
 * Used for deterministic invoice filenames. Diacritics are folded to ASCII so
 * names like "Café Studio" become "cafe-studio".
 */
export const slugify = (input: string): string => {
    const normalized = input.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

    return normalized
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
}

/**
 * Builds the base filename for an invoice, e.g. `INV-2026-001-kcw-builds`.
 * Falls back gracefully when the client name slugifies to nothing.
 */
export const invoiceFileBase = (invoiceNumber: string, clientLabel: string): string => {
    const numberPart = slugify(invoiceNumber).toUpperCase() || 'INVOICE'
    const clientPart = slugify(clientLabel)
    return clientPart ? `${numberPart}-${clientPart}` : numberPart
}
