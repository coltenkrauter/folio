import { stableStringify } from '../shared/fileSystem.js'
import { normalizeInvoice } from './normalizeInvoice.js'
import type { Invoice } from './invoiceTypes.js'

/**
 * Serializes an invoice to deterministic, pretty JSON (alphabetized keys,
 * trailing newline). The same invoice always produces byte-identical output,
 * which keeps files diff-friendly and portable.
 */
export const serializeInvoice = (invoice: Invoice): string => stableStringify(invoice)

/** Parses and validates invoice JSON text back into a canonical invoice. */
export const deserializeInvoice = (contents: string): Invoice => normalizeInvoice(JSON.parse(contents))
