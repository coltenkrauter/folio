import { describe, expect, it } from 'vitest'

import { renderInvoiceHtml } from '../../src/pdf/renderInvoiceHtml.js'
import { sampleInvoice } from '../support/fixtures.js'

describe('renderInvoiceHtml', () => {
    it('includes the essential invoice information', async () => {
        const html = await renderInvoiceHtml(sampleInvoice())
        // The visible "INVOICE" is CSS text-transform; the markup says "Invoice".
        expect(html).toContain('Invoice')
        expect(html).toContain('Colten Krauter')
        expect(html).toContain('Perpetual Stew Tavern')
        expect(html).toContain('INV-2026-001')
        expect(html).toContain('Total due')
        expect(html).toContain('$480.00')
        expect(html).toContain('Amounts in USD')
    })

    it('omits the tax column when no line item has tax', async () => {
        const html = await renderInvoiceHtml(sampleInvoice())
        expect(html).not.toContain('<th class="num">Tax</th>')
    })

    it('shows the tax column and rate when a line item is taxed', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({ items: [{ description: 'Work', quantity: 1, taxRate: 8.5, unitPrice: 100 }] }),
        )
        expect(html).toContain('<th class="num">Tax</th>')
        expect(html).toContain('8.5%')
    })

    it('escapes HTML in user-supplied text', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                items: [{ description: '<script>alert(1)</script>', quantity: 1, taxRate: 0, unitPrice: 5 }],
            }),
        )
        expect(html).not.toContain('<script>alert(1)</script>')
        expect(html).toContain('&lt;script&gt;')
    })

    it('renders cleanly without a logo', async () => {
        const html = await renderInvoiceHtml(sampleInvoice())
        expect(html).not.toContain('<img class="logo"')
    })

    it('renders line-item detail bullets when provided', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                items: [
                    {
                        description: 'Monthly retainer',
                        details: ['Database migration', 'Performance improvements'],
                        quantity: 1,
                        taxRate: 0,
                        unitPrice: 1667,
                    },
                ],
            }),
        )
        expect(html).toContain('class="item-details"')
        expect(html).toContain('<li>Database migration</li>')
        expect(html).toContain('<li>Performance improvements</li>')
    })

    it('shows an Hours row in the details when hours are logged', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                metadata: {
                    currency: 'USD',
                    dueDate: '2026-08-08',
                    hoursWorked: '~65',
                    invoiceNumber: 'INV-2026-001',
                    issueDate: '2026-06-30',
                    paymentTerms: 'Net 30',
                },
            }),
        )
        expect(html).toContain('Hours')
        expect(html).toContain('~65')
    })

    it('omits the payment details page when there are no bank/deposit details', async () => {
        const html = await renderInvoiceHtml(sampleInvoice())
        expect(html).not.toContain('class="pay-page"')
        expect(html).not.toContain('Payment details')
    })

    it('adds a payment details page with bank details, reference, and deposit', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                payment: {
                    bankTransfer: {
                        accountName: 'Colten Krauter',
                        accountNumber: '0001234567',
                        bankName: 'BECU (Boeing Employees Credit Union)',
                        routingNumber: '325081403',
                    },
                    depositNote: 'A 50% deposit is requested before starting new projects.',
                    instructions: 'Pay by ACH or wire.',
                    reference: 'Please include invoice INV-2026-001 with your payment.',
                    terms: 'Net 30',
                },
            }),
        )
        expect(html).toContain('class="pay-page"')
        expect(html).toContain('Payment details')
        expect(html).toContain('BECU (Boeing Employees Credit Union)')
        expect(html).toContain('Routing number')
        expect(html).toContain('Please include invoice INV-2026-001 with your payment.')
        expect(html).toContain('A 50% deposit is requested before starting new projects.')
        // SWIFT/IBAN were left blank, so their rows must not appear.
        expect(html).not.toContain('SWIFT / BIC')
        expect(html).not.toContain('IBAN')
    })

    it('leaves out empty bank rows but still shows the page for a reference only', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                payment: { reference: 'Reference: INV-2026-001', terms: 'Net 30' },
            }),
        )
        expect(html).toContain('Payment details')
        expect(html).not.toContain('Bank transfer')
        expect(html).toContain('Reference: INV-2026-001')
    })

    it('shows a pay-online section for PayPal and Venmo links', async () => {
        const html = await renderInvoiceHtml(
            sampleInvoice({
                payment: { paypal: 'paypal.me/demo', venmo: 'venmo.com/u/demo', terms: 'Net 30' },
            }),
        )
        expect(html).toContain('class="pay-page"')
        expect(html).toContain('Pay online')
        expect(html).toContain('paypal.me/demo')
        expect(html).toContain('venmo.com/u/demo')
    })
})
