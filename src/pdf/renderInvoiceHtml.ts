import { extname } from 'node:path'

import { invoiceHasTax, calculateInvoiceTotals } from '../invoice/calculateInvoiceTotals.js'
import type { Address, Invoice } from '../invoice/invoiceTypes.js'
import { formatCurrency, toMinorUnits } from '../shared/formatCurrency.js'
import { formatDate } from '../shared/formatDate.js'
import { pathExists, readTextFile } from '../shared/fileSystem.js'
import { resolvePath } from '../shared/paths.js'
import { readFile } from 'node:fs/promises'
import type { InvoiceMetaRow, InvoicePaymentBlock, InvoiceView } from './invoiceTemplate.js'
import { renderInvoiceDocument } from './invoiceTemplate.js'
import { createPdfTheme, type PageSize } from './pdfTheme.js'

export interface RenderInvoiceOptions {
    accentColor?: string
    locale?: string
    logoPath?: string
    pageSize?: PageSize
}

const MIME_BY_EXT: Record<string, string> = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
}

const trimUrl = (url: string): string => url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')

const formatQuantity = (quantity: number, locale: string): string =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(quantity)

const formatRate = (rate: number, locale: string): string =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(rate)

const cityStateLine = (address: Address): string => {
    const cityState = [address.city, address.state].filter(Boolean).join(', ')
    return [cityState, address.postalCode].filter(Boolean).join(' ').trim()
}

const addressLines = (address: Address): string[] =>
    [address.line1, address.line2, cityStateLine(address), address.country].filter(Boolean)

const businessContactLines = (invoice: Invoice): string[] => {
    const { business } = invoice
    const website = business.website ? trimUrl(business.website) : ''
    return [
        business.contactName,
        ...addressLines(business.address),
        business.email,
        business.phone,
        website,
        business.taxId ? `Tax ID: ${business.taxId}` : '',
    ].filter(Boolean)
}

const clientSubLines = (invoice: Invoice, headingIsBusiness: boolean): string[] => {
    const { client } = invoice
    const contactName = headingIsBusiness ? client.name : ''
    return [contactName, ...addressLines(client.address), client.email, client.phone].filter(Boolean)
}

const detailRows = (invoice: Invoice): InvoiceMetaRow[] => {
    const { metadata } = invoice
    const rows: InvoiceMetaRow[] = []
    if (metadata.paymentTerms) {
        rows.push({ label: 'Payment terms', value: metadata.paymentTerms })
    }
    if (metadata.purchaseOrderNumber) {
        rows.push({ label: 'PO number', value: metadata.purchaseOrderNumber })
    }
    if (metadata.projectName) {
        rows.push({ label: 'Project', value: metadata.projectName })
    }
    return rows
}

const paymentBlocks = (invoice: Invoice): InvoicePaymentBlock[] => {
    const { business, payment } = invoice
    const instructions = payment.instructions || business.paymentInstructions
    const blocks: InvoicePaymentBlock[] = []
    if (instructions) {
        blocks.push({ body: instructions, title: 'Payment' })
    }
    if (payment.achInstructions) {
        blocks.push({ body: payment.achInstructions, title: 'ACH transfer' })
    }
    if (payment.checkInstructions) {
        blocks.push({ body: payment.checkInstructions, title: 'Check by mail' })
    }
    if (payment.lateFeeNote) {
        blocks.push({ body: payment.lateFeeNote, title: 'Late fees' })
    }
    return blocks
}

const defaultFooter = (invoice: Invoice): string => {
    const website = invoice.business.website ? trimUrl(invoice.business.website) : ''
    return [website, invoice.business.email].filter(Boolean).join('   ·   ')
}

const loadLogoDataUri = async (logoPath: string): Promise<string | null> => {
    const resolved = resolvePath(logoPath)
    if (!(await pathExists(resolved))) {
        return null
    }
    const mime = MIME_BY_EXT[extname(resolved).toLowerCase()]
    if (!mime) {
        return null
    }
    try {
        if (mime === 'image/svg+xml') {
            const svg = await readTextFile(resolved)
            return `data:${mime};utf8,${encodeURIComponent(svg)}`
        }
        const bytes = await readFile(resolved)
        return `data:${mime};base64,${bytes.toString('base64')}`
    } catch {
        return null
    }
}

/**
 * Builds the complete invoice HTML document. Money and dates are formatted here
 * (the single formatting boundary); the template only arranges already-prepared
 * strings. The logo, if any, is embedded as a data URI so the HTML is fully
 * self-contained and renders identically offline.
 */
export const renderInvoiceHtml = async (invoice: Invoice, options: RenderInvoiceOptions = {}): Promise<string> => {
    const locale = options.locale ?? 'en-US'
    const { currency } = invoice.metadata
    const totals = calculateInvoiceTotals(invoice)
    const showTax = invoiceHasTax(invoice)

    const logoPath = options.logoPath ?? invoice.business.logoPath
    const logoDataUri = logoPath ? await loadLogoDataUri(logoPath) : null

    const headingIsBusiness = invoice.client.businessName !== ''
    const clientHeading = invoice.client.businessName || invoice.client.name

    const items = invoice.items.map((item, index) => {
        const line = totals.lines[index]
        const unitMinor = toMinorUnits(item.unitPrice, currency)
        const metaParts = [item.serviceDate ? formatDate(item.serviceDate, locale) : '', item.category].filter(Boolean)
        return {
            amount: formatCurrency(line?.amountMinor ?? 0, currency, locale),
            description: item.description,
            meta: metaParts.join('  ·  '),
            quantity: formatQuantity(item.quantity, locale),
            tax: item.taxRate > 0 ? `${formatRate(item.taxRate, locale)}%` : '—',
            unitPrice: formatCurrency(unitMinor, currency, locale),
        }
    })

    const view: InvoiceView = {
        business: {
            contactLines: businessContactLines(invoice),
            name: invoice.business.name,
        },
        client: {
            heading: clientHeading,
            subLines: clientSubLines(invoice, headingIsBusiness),
        },
        detailRows: detailRows(invoice),
        footerText: invoice.metadata.footerText || defaultFooter(invoice),
        identityRows: [
            { label: 'Invoice no.', value: invoice.metadata.invoiceNumber },
            { label: 'Issued', value: formatDate(invoice.metadata.issueDate, locale) },
            { label: 'Due', value: formatDate(invoice.metadata.dueDate, locale) },
        ],
        items,
        logoDataUri,
        notes: invoice.metadata.notes,
        paymentBlocks: paymentBlocks(invoice),
        showTax,
        title: 'Invoice',
        totals: {
            currencyNote: `Amounts in ${currency}`,
            subtotal: formatCurrency(totals.subtotalMinor, currency, locale),
            tax: formatCurrency(totals.taxMinor, currency, locale),
            totalDue: formatCurrency(totals.totalMinor, currency, locale),
            totalDueLabel: 'Total due',
        },
    }

    const theme = createPdfTheme({
        ...(options.accentColor ? { accentColor: options.accentColor } : {}),
        pageSize: options.pageSize ?? 'Letter',
    })

    return renderInvoiceDocument(view, theme)
}
