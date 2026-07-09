import type { z } from 'zod'

import type {
    addressSchema,
    businessProfileSchema,
    clientProfileSchema,
    currencyCodeSchema,
    invoiceLineItemSchema,
    invoiceMetadataSchema,
    invoiceSchema,
    invoiceTotalsSchema,
    paymentDetailsSchema,
} from './invoiceSchema.js'

export type Address = z.infer<typeof addressSchema>
export type BusinessProfile = z.infer<typeof businessProfileSchema>
export type ClientProfile = z.infer<typeof clientProfileSchema>
export type CurrencyCode = z.infer<typeof currencyCodeSchema>
export type Invoice = z.infer<typeof invoiceSchema>
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>
export type InvoiceMetadata = z.infer<typeof invoiceMetadataSchema>
export type PaymentDetails = z.infer<typeof paymentDetailsSchema>

/**
 * Per-line and whole-invoice money totals, always in integer minor units
 * (e.g. cents). Derived by {@link calculateInvoiceTotals}; never stored in the
 * invoice JSON so the source data stays the single source of truth.
 */
export type LineItemTotals = z.infer<typeof invoiceTotalsSchema>['lines'][number]
export type InvoiceTotals = z.infer<typeof invoiceTotalsSchema>
