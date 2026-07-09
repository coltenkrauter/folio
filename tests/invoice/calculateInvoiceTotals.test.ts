import { describe, expect, it } from 'vitest'

import { calculateInvoiceTotals, calculateLineTotals, invoiceHasTax } from '../../src/invoice/calculateInvoiceTotals.js'
import { sampleInvoice } from '../support/fixtures.js'

describe('calculateLineTotals', () => {
    it('multiplies quantity by unit price in minor units', () => {
        expect(calculateLineTotals(2, 125, 0, 'USD')).toEqual({ amountMinor: 25000, taxMinor: 0, totalMinor: 25000 })
    })

    it('supports decimal quantities without floating-point drift', () => {
        expect(calculateLineTotals(2.5, 120, 0, 'USD').amountMinor).toBe(30000)
    })

    it('handles cents in the unit price precisely', () => {
        expect(calculateLineTotals(3, 19.99, 0, 'USD').amountMinor).toBe(5997)
    })

    it('applies the line tax rate as a percentage', () => {
        expect(calculateLineTotals(1, 200, 8.5, 'USD')).toEqual({
            amountMinor: 20000,
            taxMinor: 1700,
            totalMinor: 21700,
        })
    })

    it('rounds tax to the nearest minor unit', () => {
        // 100.00 * 7.25% = 7.25 -> 725 minor units exactly
        expect(calculateLineTotals(1, 100, 7.25, 'USD').taxMinor).toBe(725)
        // 33.33 * 8.5% = 2.833... -> rounds to 283 cents
        expect(calculateLineTotals(1, 33.33, 8.5, 'USD').taxMinor).toBe(283)
    })

    it('respects currencies with no minor units (JPY)', () => {
        expect(calculateLineTotals(2, 1500, 10, 'JPY')).toEqual({ amountMinor: 3000, taxMinor: 300, totalMinor: 3300 })
    })

    it('rounds a sub-cent unit price only once, from the full product', () => {
        // 1000 * $0.335 = $335.00 exactly; pre-rounding the unit price would give $340.00.
        expect(calculateLineTotals(1000, 0.335, 0, 'USD').amountMinor).toBe(33500)
        // 100 * $19.999 = $1,999.90; pre-rounding would give $2,000.00.
        expect(calculateLineTotals(100, 19.999, 0, 'USD').amountMinor).toBe(199990)
    })
})

describe('calculateInvoiceTotals', () => {
    it('sums a single untaxed line', () => {
        const totals = calculateInvoiceTotals(sampleInvoice())
        expect(totals).toMatchObject({ subtotalMinor: 48000, taxMinor: 0, totalMinor: 48000 })
    })

    it('sums mixed taxed and untaxed lines and keeps the figures balanced', () => {
        const invoice = sampleInvoice({
            items: [
                { description: 'Design', quantity: 2.5, taxRate: 8.5, unitPrice: 140 },
                { description: 'Hosting', quantity: 1, taxRate: 0, unitPrice: 19.99 },
                { description: 'Docs', quantity: 1, taxRate: 8.5, unitPrice: 220 },
            ],
        })
        const totals = calculateInvoiceTotals(invoice)

        expect(totals.subtotalMinor).toBe(35000 + 1999 + 22000)
        expect(totals.taxMinor).toBe(2975 + 0 + 1870)
        expect(totals.totalMinor).toBe(totals.subtotalMinor + totals.taxMinor)
        expect(totals.lines).toHaveLength(3)
    })

    it('reports whether any line carries tax', () => {
        expect(invoiceHasTax(sampleInvoice())).toBe(false)
        expect(
            invoiceHasTax(sampleInvoice({ items: [{ description: 'x', quantity: 1, taxRate: 5, unitPrice: 10 }] })),
        ).toBe(true)
    })
})
