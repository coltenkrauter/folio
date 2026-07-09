import { describe, expect, it } from 'vitest'

import { invoiceFileBase, slugify } from '../../src/shared/slugify.js'

describe('slugify', () => {
    it('lowercases and hyphenates text', () => {
        expect(slugify('KCW Builds')).toBe('kcw-builds')
    })

    it('folds diacritics to ASCII', () => {
        expect(slugify('Café Studio')).toBe('cafe-studio')
    })

    it('collapses symbols and repeated separators', () => {
        expect(slugify('  Multiple   Spaces & Symbols!! ')).toBe('multiple-spaces-symbols')
    })

    it('returns an empty string for symbol-only input', () => {
        expect(slugify('***')).toBe('')
    })
})

describe('invoiceFileBase', () => {
    it('combines the invoice number and client label', () => {
        expect(invoiceFileBase('INV-2026-001', 'KCW Builds')).toBe('INV-2026-001-kcw-builds')
    })

    it('falls back gracefully when the client label is empty', () => {
        expect(invoiceFileBase('INV-1', '')).toBe('INV-1')
    })

    it('uses a placeholder when the invoice number slugifies to nothing', () => {
        expect(invoiceFileBase('***', 'Acme')).toBe('INVOICE-acme')
    })
})
