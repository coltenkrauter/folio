import { describe, expect, it } from 'vitest'

import { createPdfTheme } from '../../src/pdf/pdfTheme.js'

describe('createPdfTheme', () => {
    it('defaults to a grayscale accent and Letter page', () => {
        const theme = createPdfTheme()
        expect(theme.color.accent).toBe('#12141c')
        expect(theme.page.size).toBe('Letter')
    })

    it('applies a valid accent color', () => {
        expect(createPdfTheme({ accentColor: '#2f5d50' }).color.accent).toBe('#2f5d50')
    })

    it('ignores an invalid accent color instead of throwing', () => {
        expect(createPdfTheme({ accentColor: 'not-a-color' }).color.accent).toBe('#12141c')
    })

    it('honors the requested page size', () => {
        expect(createPdfTheme({ pageSize: 'A4' }).page.size).toBe('A4')
    })
})
