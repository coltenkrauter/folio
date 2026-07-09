import { pathToFileURL } from 'node:url'

import { loadConfigOrNull } from '../../config/loadConfig.js'
import { normalizeInvoice } from '../../invoice/normalizeInvoice.js'
import { readJsonFile, writeTextFile } from '../../shared/fileSystem.js'
import { logger } from '../../shared/logger.js'
import { relativeToCwd, resolvePath } from '../../shared/paths.js'
import { renderInvoiceHtml, type RenderInvoiceOptions } from '../../pdf/renderInvoiceHtml.js'

const htmlPathFor = (jsonPath: string): string =>
    /\.json$/i.test(jsonPath) ? jsonPath.replace(/\.json$/i, '.preview.html') : `${jsonPath}.preview.html`

/**
 * `folio preview <file>` — write a self-contained HTML preview of an invoice.
 * No browser is required to generate it; open the file to see the design.
 */
export const runPreview = async (file: string): Promise<void> => {
    const jsonPath = resolvePath(file)
    const raw = await readJsonFile(jsonPath)
    const invoice = normalizeInvoice(raw)
    const { config } = await loadConfigOrNull()

    const options: RenderInvoiceOptions = {
        ...(config?.accentColor ? { accentColor: config.accentColor } : {}),
        ...(invoice.business.logoPath ? { logoPath: invoice.business.logoPath } : {}),
    }

    const html = await renderInvoiceHtml(invoice, options)
    const htmlPath = htmlPathFor(jsonPath)
    await writeTextFile(htmlPath, html)

    logger.success(`Wrote HTML preview → ${relativeToCwd(htmlPath)}`)
    logger.detail(`Open it: ${pathToFileURL(htmlPath).href}`)
}
