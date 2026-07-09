import type { Invoice } from '../../src/invoice/invoiceTypes.js'
import { normalizeInvoice } from '../../src/invoice/normalizeInvoice.js'

/** A complete, valid raw invoice payload for tests. Override any part per case. */
export const sampleInvoiceInput = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    business: {
        address: {
            city: 'Bozeman',
            country: 'United States',
            line1: '48 Sourdough Ridge',
            line2: '',
            postalCode: '59715',
            state: 'MT',
        },
        email: 'hello@coltenkrauter.com',
        name: 'Colten Krauter',
        phone: '406-555-0147',
        website: 'https://coltenkrauter.com',
    },
    client: {
        address: {
            city: 'Missoula',
            country: 'United States',
            line1: '456 Client Road',
            line2: '',
            postalCode: '59801',
            state: 'MT',
        },
        businessName: 'KCW Builds',
        email: 'andrew@kcwbuilds.com',
        name: 'Andrew King',
        phone: '',
    },
    items: [{ description: 'Workstation setup and configuration', quantity: 1, taxRate: 0, unitPrice: 480 }],
    metadata: {
        currency: 'USD',
        dueDate: '2026-08-08',
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-07-09',
        notes: 'Thank you for your business.',
        paymentTerms: 'Net 30',
        projectName: 'Workstation Setup',
        purchaseOrderNumber: '',
    },
    payment: { instructions: 'Pay by ACH or check.', terms: 'Net 30' },
    ...overrides,
})

/** A normalized, valid invoice for tests. */
export const sampleInvoice = (overrides: Record<string, unknown> = {}): Invoice =>
    normalizeInvoice(sampleInvoiceInput(overrides))
