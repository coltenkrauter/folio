import { describe, expect, it } from 'vitest'

import { renderInvoiceHtml } from '../../src/pdf/renderInvoiceHtml.js'
import { sampleInvoice } from '../support/fixtures.js'

describe('renderInvoiceHtml', () => {
    it('includes the essential invoice information', async () => {
        const html = await renderInvoiceHtml(sampleInvoice())
        // The visible "INVOICE" is CSS text-transform; the markup says "Invoice".
        expect(html).toContain('Invoice')
        expect(html).toContain('Colten Krauter')
        expect(html).toContain('KCW Builds')
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
})
