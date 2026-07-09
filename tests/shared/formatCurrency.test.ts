import { describe, expect, it } from 'vitest'

import { currencyFractionDigits, formatCurrency, toMajorUnits, toMinorUnits } from '../../src/shared/formatCurrency.js'

describe('currency formatting', () => {
    it('knows minor-unit digits per currency', () => {
        expect(currencyFractionDigits('USD')).toBe(2)
        expect(currencyFractionDigits('JPY')).toBe(0)
    })

    it('converts major to minor units, rounding cents safely', () => {
        expect(toMinorUnits(19.99, 'USD')).toBe(1999)
        expect(toMinorUnits(125.5, 'USD')).toBe(12550)
        expect(toMinorUnits(1500, 'JPY')).toBe(1500)
    })

    it('converts minor units back to major units', () => {
        expect(toMajorUnits(12550, 'USD')).toBe(125.5)
        expect(toMajorUnits(1500, 'JPY')).toBe(1500)
    })

    it('formats USD with a symbol and grouping', () => {
        expect(formatCurrency(199900, 'USD')).toBe('$1,999.00')
    })

    it('formats JPY without decimals', () => {
        expect(formatCurrency(1500, 'JPY')).toBe('¥1,500')
    })

    it('respects the requested locale', () => {
        expect(formatCurrency(123456, 'EUR', 'de-DE')).toBe('1.234,56 €')
    })
})
