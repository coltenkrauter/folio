import { describe, expect, it } from 'vitest'

import type { PdfRenderer } from '../../src/pdf/pdfRenderer.js'
import { resolveChromiumExecutable } from '../../src/pdf/pdfRenderer.js'
import { renderInvoicePdfBytes } from '../../src/pdf/renderInvoicePdf.js'
import { sampleInvoice } from '../support/fixtures.js'

describe('renderInvoicePdfBytes', () => {
    it('renders HTML and hands it to the injected renderer', async () => {
        let capturedHtml = ''
        const renderer: PdfRenderer = {
            async renderPdf(html: string) {
                capturedHtml = html
                return new Uint8Array([1, 2, 3])
            },
        }

        const bytes = await renderInvoicePdfBytes(sampleInvoice(), { renderer })
        expect(capturedHtml).toContain('Invoice')
        expect(Array.from(bytes)).toEqual([1, 2, 3])
    })
})

describe('resolveChromiumExecutable', () => {
    it('returns an explicit override that exists on disk', () => {
        // The Node binary always exists — a stable stand-in for a browser path.
        expect(resolveChromiumExecutable(process.execPath)).toBe(process.execPath)
    })

    it('ignores an override that does not exist and keeps searching', () => {
        const result = resolveChromiumExecutable('/nope/not/a/real/chromium')
        expect(result).not.toBe('/nope/not/a/real/chromium')
    })
})
