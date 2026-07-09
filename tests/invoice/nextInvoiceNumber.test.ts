import { describe, expect, it } from 'vitest'

import { nextInvoiceNumber } from '../../src/invoice/nextInvoiceNumber.js'

describe('nextInvoiceNumber', () => {
    it('increments the trailing number', () => {
        expect(nextInvoiceNumber('INV-2026-001', '2026')).toBe('INV-2026-002')
    })

    it('carries into a wider number while keeping zero-padding width', () => {
        expect(nextInvoiceNumber('INV-2026-099', '2026')).toBe('INV-2026-100')
        expect(nextInvoiceNumber('INV-2026-009', '2026')).toBe('INV-2026-010')
    })

    it('preserves a trailing non-numeric suffix', () => {
        expect(nextInvoiceNumber('2026-007-DRAFT', '2026')).toBe('2026-008-DRAFT')
    })

    it('falls back to INV-<year>-001 with no previous number', () => {
        expect(nextInvoiceNumber(undefined, '2027')).toBe('INV-2027-001')
        expect(nextInvoiceNumber('', '2027')).toBe('INV-2027-001')
    })

    it('returns the input unchanged when it has no digits to increment', () => {
        expect(nextInvoiceNumber('DRAFT', '2026')).toBe('DRAFT')
    })
})
