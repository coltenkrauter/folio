import { loadConfigOrNull } from '../../config/loadConfig.js'
import { normalizeInvoice } from '../../invoice/normalizeInvoice.js'
import { readJsonFile } from '../../shared/fileSystem.js'
import { logger } from '../../shared/logger.js'
import { relativeToCwd, resolvePath } from '../../shared/paths.js'
import { renderInvoicePdfToFile, type RenderInvoicePdfOptions } from '../../pdf/renderInvoicePdf.js'

const pdfPathFor = (jsonPath: string): string =>
    /\.json$/i.test(jsonPath) ? jsonPath.replace(/\.json$/i, '.pdf') : `${jsonPath}.pdf`

/**
 * `folio render <file>` — validate an invoice JSON file and regenerate its PDF.
 * The PDF is written next to the JSON with a matching name.
 */
export const runRender = async (file: string): Promise<void> => {
    const jsonPath = resolvePath(file)
    const raw = await readJsonFile(jsonPath)
    const invoice = normalizeInvoice(raw)
    const { config } = await loadConfigOrNull()

    const options: RenderInvoicePdfOptions = {
        ...(config?.accentColor ? { accentColor: config.accentColor } : {}),
        ...(invoice.business.logoPath ? { logoPath: invoice.business.logoPath } : {}),
    }

    const pdfPath = pdfPathFor(jsonPath)
    await renderInvoicePdfToFile(invoice, pdfPath, options)
    logger.success(`Generated PDF → ${relativeToCwd(pdfPath)}`)
}
