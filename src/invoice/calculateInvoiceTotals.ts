import { currencyFractionDigits } from '../shared/formatCurrency.js'
import type { Invoice, InvoiceTotals, LineItemTotals } from './invoiceTypes.js'

/**
 * Computes invoice totals in integer minor units to avoid floating-point slop.
 *
 * Rules:
 * - Line amount   = round(quantity * unitPrice), in minor units.
 * - Line tax      = round(lineAmount * taxRate / 100).
 * - Subtotal      = sum of line amounts.
 * - Total tax     = sum of line taxes.
 * - Grand total   = subtotal + total tax.
 *
 * The line amount is rounded once, from the full `quantity * unitPrice` product,
 * so sub-cent unit prices (e.g. per-piece pricing) are not pre-rounded per unit.
 * Each stored value stays an integer, so the printed figures always add up.
 */
export const calculateLineTotals = (
    quantity: number,
    unitPrice: number,
    taxRate: number,
    currency: string,
): LineItemTotals => {
    const factor = 10 ** currencyFractionDigits(currency)
    const amountMinor = Math.round(quantity * unitPrice * factor)
    const taxMinor = Math.round((amountMinor * taxRate) / 100)
    return {
        amountMinor,
        taxMinor,
        totalMinor: amountMinor + taxMinor,
    }
}

export const calculateInvoiceTotals = (invoice: Invoice): InvoiceTotals => {
    const { currency } = invoice.metadata

    const lines = invoice.items.map((item) =>
        calculateLineTotals(item.quantity, item.unitPrice, item.taxRate, currency),
    )

    const subtotalMinor = lines.reduce((sum, line) => sum + line.amountMinor, 0)
    const taxMinor = lines.reduce((sum, line) => sum + line.taxMinor, 0)

    return {
        currency,
        lines,
        subtotalMinor,
        taxMinor,
        totalMinor: subtotalMinor + taxMinor,
    }
}

/** True when any line item carries a non-zero tax rate. */
export const invoiceHasTax = (invoice: Invoice): boolean => invoice.items.some((item) => item.taxRate > 0)
