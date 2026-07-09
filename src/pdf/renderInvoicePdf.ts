import type { Invoice } from '../invoice/invoiceTypes.js'
import { writeBinaryFile } from '../shared/fileSystem.js'
import { createPlaywrightPdfRenderer, type PdfRenderer } from './pdfRenderer.js'
import { renderInvoiceHtml, type RenderInvoiceOptions } from './renderInvoiceHtml.js'

export interface RenderInvoicePdfOptions extends RenderInvoiceOptions {
    /** Explicit Chromium path; falls back to auto-detection. */
    executablePath?: string
    /** Injectable renderer (used in tests to avoid launching a browser). */
    renderer?: PdfRenderer
}

/** Renders an invoice to PDF bytes in memory. */
export const renderInvoicePdfBytes = async (
    invoice: Invoice,
    options: RenderInvoicePdfOptions = {},
): Promise<Uint8Array> => {
    const html = await renderInvoiceHtml(invoice, options)
    const renderer =
        options.renderer ??
        createPlaywrightPdfRenderer(options.executablePath ? { executablePath: options.executablePath } : {})
    return renderer.renderPdf(html)
}

/** Renders an invoice to PDF and writes it to `outputPath`, returning that path. */
export const renderInvoicePdfToFile = async (
    invoice: Invoice,
    outputPath: string,
    options: RenderInvoicePdfOptions = {},
): Promise<string> => {
    const bytes = await renderInvoicePdfBytes(invoice, options)
    await writeBinaryFile(outputPath, bytes)
    return outputPath
}
