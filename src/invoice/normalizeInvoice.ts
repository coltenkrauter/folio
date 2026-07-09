import { FolioError, formatZodIssues } from '../shared/errors.js'
import { invoiceSchema } from './invoiceSchema.js'
import type { Invoice } from './invoiceTypes.js'

/** Collapses runs of inline whitespace to single spaces without touching newlines. */
const collapseInlineWhitespace = (value: string): string => value.replace(/[^\S\n]{2,}/g, ' ').trim()

/**
 * Validates and canonicalizes invoice data into a stable, render-ready shape.
 * Throws {@link FolioError} on invalid input. Schema parsing trims and applies
 * defaults; this additionally tidies free text so line items read cleanly.
 */
export const normalizeInvoice = (data: unknown): Invoice => {
    const parsed = invoiceSchema.safeParse(data)
    if (!parsed.success) {
        throw new FolioError('INVOICE_INVALID', 'The invoice data is not valid.', {
            details: formatZodIssues(parsed.error),
        })
    }

    const invoice = parsed.data
    return {
        ...invoice,
        items: invoice.items.map((item) => ({
            ...item,
            category: collapseInlineWhitespace(item.category),
            description: collapseInlineWhitespace(item.description),
            details: item.details.map(collapseInlineWhitespace).filter(Boolean),
        })),
    }
}
