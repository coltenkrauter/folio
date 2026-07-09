import { formatZodIssues } from '../shared/errors.js'
import { invoiceSchema } from './invoiceSchema.js'
import type { Invoice } from './invoiceTypes.js'

export interface InvoiceValidationSuccess {
    invoice: Invoice
    success: true
}

export interface InvoiceValidationFailure {
    issues: string[]
    success: false
}

export type InvoiceValidationResult = InvoiceValidationSuccess | InvoiceValidationFailure

/**
 * Validates untrusted invoice data (e.g. a hand-edited JSON file) without
 * throwing, returning either the typed invoice or a list of readable issues.
 * Use this at boundaries where you want to present errors; use
 * {@link normalizeInvoice} when a throw is the right behavior.
 */
export const validateInvoice = (data: unknown): InvoiceValidationResult => {
    const result = invoiceSchema.safeParse(data)
    if (result.success) {
        return { invoice: result.data, success: true }
    }
    return { issues: formatZodIssues(result.error), success: false }
}
