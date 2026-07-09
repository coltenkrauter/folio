import { describe, expect, it } from 'vitest'

import { normalizeInvoice } from '../../src/invoice/normalizeInvoice.js'
import { validateInvoice } from '../../src/invoice/validateInvoice.js'
import { isFolioError } from '../../src/shared/errors.js'
import { sampleInvoiceInput } from '../support/fixtures.js'

describe('invoice validation', () => {
    it('accepts a valid invoice and applies defaults for optional fields', () => {
        const result = validateInvoice(sampleInvoiceInput())
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.invoice.metadata.footerText).toBe('')
            expect(result.invoice.items[0]?.category).toBe('')
            expect(result.invoice.items[0]?.taxRate).toBe(0)
            // Payment gains a stable shape even when omitted: bankTransfer + notes default in.
            expect(result.invoice.payment.bankTransfer.accountName).toBe('')
            expect(result.invoice.payment.reference).toBe('')
            expect(result.invoice.payment.depositNote).toBe('')
        }
    })

    it('rejects a negative unit price', () => {
        const result = validateInvoice(
            sampleInvoiceInput({ items: [{ description: 'x', quantity: 1, unitPrice: -5 }] }),
        )
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.issues.some((issue) => issue.includes('Unit price cannot be negative'))).toBe(true)
        }
    })

    it('rejects a non-positive quantity', () => {
        const result = validateInvoice(sampleInvoiceInput({ items: [{ description: 'x', quantity: 0, unitPrice: 5 }] }))
        expect(result.success).toBe(false)
    })

    it('rejects a tax rate above 100 percent', () => {
        const result = validateInvoice(
            sampleInvoiceInput({ items: [{ description: 'x', quantity: 1, taxRate: 150, unitPrice: 5 }] }),
        )
        expect(result.success).toBe(false)
    })

    it('requires at least one line item', () => {
        const result = validateInvoice(sampleInvoiceInput({ items: [] }))
        expect(result.success).toBe(false)
    })

    it('requires a client name or business name', () => {
        const result = validateInvoice(
            sampleInvoiceInput({
                client: {
                    address: { city: '', country: '', line1: '', line2: '', postalCode: '', state: '' },
                    businessName: '',
                    email: '',
                    name: '',
                    phone: '',
                },
            }),
        )
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.issues.some((issue) => issue.includes('client'))).toBe(true)
        }
    })

    it('rejects a due date before the issue date', () => {
        const result = validateInvoice(
            sampleInvoiceInput({
                metadata: {
                    currency: 'USD',
                    dueDate: '2026-07-01',
                    invoiceNumber: 'INV-1',
                    issueDate: '2026-07-09',
                    paymentTerms: 'Net 30',
                },
            }),
        )
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.issues.some((issue) => issue.includes('Due date'))).toBe(true)
        }
    })

    it('rejects an invalid currency code', () => {
        const result = validateInvoice(
            sampleInvoiceInput({
                metadata: { currency: 'ZZZ', dueDate: '2026-08-08', invoiceNumber: 'INV-1', issueDate: '2026-07-09' },
            }),
        )
        expect(result.success).toBe(false)
    })

    it('normalizeInvoice throws a FolioError with details on invalid data', () => {
        try {
            normalizeInvoice({ business: { name: '' }, items: [] })
            expect.unreachable('should have thrown')
        } catch (error) {
            expect(isFolioError(error)).toBe(true)
            if (isFolioError(error)) {
                expect(error.code).toBe('INVOICE_INVALID')
                expect(error.details.length).toBeGreaterThan(0)
            }
        }
    })

    it('collapses inline whitespace in descriptions', () => {
        const invoice = normalizeInvoice(
            sampleInvoiceInput({ items: [{ description: 'Setup   and    config', quantity: 1, unitPrice: 10 }] }),
        )
        expect(invoice.items[0]?.description).toBe('Setup and config')
    })
})
