import { z } from 'zod'

import { isIsoDate } from '../shared/formatDate.js'

/**
 * Zod schemas are the single source of truth for invoice shape and validation.
 * Types in `invoiceTypes.ts` are inferred from these, so the runtime and
 * compile-time views can never drift.
 *
 * Conventions:
 * - Text fields are trimmed. Optional text defaults to '' so the JSON shape is
 *   stable (same keys every time) rather than sprouting/dropping keys.
 * - Money is entered in major units (dollars) and validated as non-negative.
 * - Tax rate is entered as a percentage (0-100) and normalized at calc time.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const trimmed = z.string().trim()

const requiredText = (label: string) => trimmed.min(1, `${label} is required.`)

const optionalText = trimmed.default('')

const emailOrEmpty = trimmed.refine((v) => v === '' || EMAIL_RE.test(v), 'Enter a valid email address.')

const urlOrEmpty = trimmed.refine((v) => {
    if (v === '') {
        return true
    }
    try {
        const url = new URL(v)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}, 'Enter a valid URL, including https://')

const isoDate = trimmed.refine(isIsoDate, 'Use a valid date in YYYY-MM-DD format.')

/** Currencies Folio can format and validate. Extend as needed. */
export const SUPPORTED_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
    'NZD',
    'CHF',
    'JPY',
    'SEK',
    'NOK',
    'DKK',
    'INR',
    'SGD',
    'HKD',
    'MXN',
    'BRL',
    'ZAR',
    'AED',
    'PLN',
    'CZK',
] as const

export const currencyCodeSchema = z.enum(SUPPORTED_CURRENCIES)

export const addressSchema = z.object({
    city: optionalText,
    country: optionalText,
    line1: optionalText,
    line2: optionalText,
    postalCode: optionalText,
    state: optionalText,
})

export const businessProfileSchema = z.object({
    address: addressSchema,
    contactName: optionalText,
    email: emailOrEmpty,
    logoPath: optionalText,
    name: requiredText('Business name'),
    paymentInstructions: optionalText,
    phone: optionalText,
    taxId: optionalText,
    website: urlOrEmpty,
})

export const clientProfileSchema = z
    .object({
        address: addressSchema,
        businessName: optionalText,
        email: emailOrEmpty,
        name: optionalText,
        phone: optionalText,
    })
    .refine((client) => client.name !== '' || client.businessName !== '', {
        message: 'Add a client name or client business name.',
        path: ['name'],
    })

export const invoiceLineItemSchema = z.object({
    category: optionalText,
    description: requiredText('Description'),
    details: z.array(trimmed).default([]),
    quantity: z
        .number({ invalid_type_error: 'Quantity must be a number.' })
        .finite('Quantity must be a real number.')
        .positive('Quantity must be greater than zero.'),
    serviceDate: z.union([isoDate, z.literal('')]).default(''),
    taxRate: z
        .number({ invalid_type_error: 'Tax rate must be a number.' })
        .finite('Tax rate must be a real number.')
        .min(0, 'Tax rate cannot be negative.')
        .max(100, 'Tax rate is a percentage between 0 and 100.')
        .default(0),
    unitPrice: z
        .number({ invalid_type_error: 'Unit price must be a number.' })
        .finite('Unit price must be a real number.')
        .min(0, 'Unit price cannot be negative.'),
})

export const invoiceMetadataSchema = z.object({
    currency: currencyCodeSchema,
    dueDate: isoDate,
    footerText: optionalText,
    hoursWorked: optionalText,
    invoiceNumber: requiredText('Invoice number'),
    issueDate: isoDate,
    notes: optionalText,
    paymentTerms: optionalText,
    projectName: optionalText,
    purchaseOrderNumber: optionalText,
})

/** Bank / wire remittance details. Every field is optional; only filled ones render. */
export const bankTransferSchema = z.object({
    accountName: optionalText,
    accountNumber: optionalText,
    bankName: optionalText,
    iban: optionalText,
    routingNumber: optionalText,
    swift: optionalText,
})

export const paymentDetailsSchema = z.object({
    achInstructions: optionalText,
    bankTransfer: bankTransferSchema.default({}),
    checkInstructions: optionalText,
    depositNote: optionalText,
    instructions: optionalText,
    paypal: optionalText,
    reference: optionalText,
    terms: optionalText,
    venmo: optionalText,
})

export const invoiceSchema = z
    .object({
        business: businessProfileSchema,
        client: clientProfileSchema,
        items: z.array(invoiceLineItemSchema).min(1, 'Add at least one line item.'),
        metadata: invoiceMetadataSchema,
        payment: paymentDetailsSchema,
    })
    .superRefine((invoice, ctx) => {
        if (isIsoDate(invoice.metadata.issueDate) && isIsoDate(invoice.metadata.dueDate)) {
            if (invoice.metadata.dueDate < invoice.metadata.issueDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Due date cannot be before the issue date.',
                    path: ['metadata', 'dueDate'],
                })
            }
        }
    })

export const invoiceTotalsSchema = z.object({
    currency: currencyCodeSchema,
    lines: z.array(
        z.object({
            amountMinor: z.number().int(),
            taxMinor: z.number().int(),
            totalMinor: z.number().int(),
        }),
    ),
    subtotalMinor: z.number().int(),
    taxMinor: z.number().int(),
    totalMinor: z.number().int(),
})
