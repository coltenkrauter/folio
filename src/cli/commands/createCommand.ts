import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { intro, log, note, outro, spinner } from '@clack/prompts'

import { loadConfigOrNull } from '../../config/loadConfig.js'
import type { FolioConfig } from '../../config/configTypes.js'
import { rememberInvoice } from '../../config/rememberInvoice.js'
import { saveConfig } from '../../config/saveConfig.js'
import { calculateInvoiceTotals } from '../../invoice/calculateInvoiceTotals.js'
import type { Invoice } from '../../invoice/invoiceTypes.js'
import { serializeInvoice } from '../../invoice/serializeInvoice.js'
import { isFolioError } from '../../shared/errors.js'
import { writeTextFile } from '../../shared/fileSystem.js'
import { formatCurrency } from '../../shared/formatCurrency.js'
import { formatDate } from '../../shared/formatDate.js'
import { relativeToCwd, resolvePath } from '../../shared/paths.js'
import { invoiceFileBase } from '../../shared/slugify.js'
import { renderInvoicePdfToFile, type RenderInvoicePdfOptions } from '../../pdf/renderInvoicePdf.js'
import { createInvoiceFlow } from '../flows/createInvoiceFlow.js'
import { askConfirm } from '../prompts/prompt.js'

export interface CreateCommandOptions {
    ai?: boolean
}

interface InvoicePaths {
    jsonPath: string
    pdfPath: string
}

const resolveInvoicePaths = (invoice: Invoice, outputDir: string): InvoicePaths => {
    const clientLabel = invoice.client.businessName || invoice.client.name
    const base = invoiceFileBase(invoice.metadata.invoiceNumber, clientLabel)
    const dir = resolvePath(outputDir)
    return {
        jsonPath: join(dir, `${base}.json`),
        pdfPath: join(dir, `${base}.pdf`),
    }
}

const buildSummary = (invoice: Invoice): string => {
    const totals = calculateInvoiceTotals(invoice)
    const client = invoice.client.businessName || invoice.client.name
    return [
        `Invoice   ${invoice.metadata.invoiceNumber}`,
        `Bill to   ${client}`,
        `Issued    ${formatDate(invoice.metadata.issueDate)}`,
        `Due       ${formatDate(invoice.metadata.dueDate)}`,
        `Items     ${invoice.items.length}`,
        `Total     ${formatCurrency(totals.totalMinor, invoice.metadata.currency)}`,
    ].join('\n')
}

const pdfOptions = (config: FolioConfig | null, invoice: Invoice): RenderInvoicePdfOptions => ({
    ...(config?.accentColor ? { accentColor: config.accentColor } : {}),
    ...(invoice.business.logoPath ? { logoPath: invoice.business.logoPath } : {}),
})

/**
 * Remembers the client, payment details, and invoice number so the next
 * `folio create` pre-fills them. Requires a saved config; nudges `folio init`
 * otherwise. Never fails a completed invoice — remembering is a convenience.
 */
const rememberForNextTime = async (config: FolioConfig | null, invoice: Invoice): Promise<void> => {
    if (!config) {
        log.info('Tip: run `folio init` to save your details and speed up your next invoice.')
        return
    }
    try {
        await saveConfig(rememberInvoice(config, invoice))
        log.info('Remembered your client, payment details, and invoice number for next time.')
    } catch {
        // Best-effort: the invoice is already saved, so a config write failure is not fatal.
    }
}

/** `folio create` — interactively build an invoice, then write JSON + PDF. */
export const runCreate = async (options: CreateCommandOptions = {}): Promise<void> => {
    intro(options.ai ? 'Folio · new invoice (AI wording)' : 'Folio · new invoice')

    const { config, invalid } = await loadConfigOrNull()
    if (invalid) {
        log.warn('Ignoring an unreadable config. Run `folio init` to recreate it.')
    } else if (!config) {
        log.info('No saved config found. You can run `folio init` first to reuse business details.')
    }

    const invoice = await createInvoiceFlow({ ai: Boolean(options.ai), config })

    note(buildSummary(invoice), 'Review')
    if (!(await askConfirm('Generate invoice JSON and PDF?', true))) {
        outro('Nothing saved.')
        return
    }

    const outputDir = config?.outputDir ?? 'invoices'
    const { jsonPath, pdfPath } = resolveInvoicePaths(invoice, outputDir)

    const existing = [jsonPath, pdfPath].filter((path) => existsSync(path))
    if (existing.length > 0) {
        const overwrite = await askConfirm(`Overwrite ${existing.map(relativeToCwd).join(' and ')}?`, false)
        if (!overwrite) {
            outro('Kept existing files.')
            return
        }
    }

    await writeTextFile(jsonPath, serializeInvoice(invoice))
    log.success(`Saved invoice JSON → ${relativeToCwd(jsonPath)}`)
    await rememberForNextTime(config, invoice)

    const progress = spinner()
    progress.start('Generating PDF')
    try {
        await renderInvoicePdfToFile(invoice, pdfPath, pdfOptions(config, invoice))
        progress.stop('Generated PDF')
        log.success(`Saved PDF → ${relativeToCwd(pdfPath)}`)
        outro('Done.')
    } catch (error) {
        progress.stop('PDF generation skipped')
        if (isFolioError(error) && (error.code === 'BROWSER_NOT_FOUND' || error.code === 'PDF_RENDER_FAILED')) {
            log.warn(error.message)
            error.details.forEach((detail) => log.message(detail))
            log.info(
                `Your invoice JSON is saved. Once a browser is available, run: folio render ${relativeToCwd(jsonPath)}`,
            )
            outro('Saved JSON — PDF pending.')
            return
        }
        throw error
    }
}
