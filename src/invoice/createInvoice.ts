import { normalizeInvoice } from './normalizeInvoice.js'
import type {
    BusinessProfile,
    ClientProfile,
    Invoice,
    InvoiceLineItem,
    InvoiceMetadata,
    PaymentDetails,
} from './invoiceTypes.js'

export interface CreateInvoiceInput {
    business: BusinessProfile
    client: ClientProfile
    items: InvoiceLineItem[]
    metadata: InvoiceMetadata
    payment: PaymentDetails
}

/**
 * Assembles a canonical {@link Invoice} from its parts. Pure and side-effect
 * free: it validates and normalizes, then returns the invoice. Callers (the CLI
 * flow) are responsible for gathering the parts and applying config defaults.
 */
export const createInvoice = (input: CreateInvoiceInput): Invoice => normalizeInvoice(input)
