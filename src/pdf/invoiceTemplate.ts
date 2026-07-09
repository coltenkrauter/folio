import type { PdfTheme } from './pdfTheme.js'

/**
 * The invoice HTML template. It receives a fully-prepared, display-ready view
 * model (all money and dates already formatted by `renderInvoiceHtml`) and a
 * theme, and returns a complete, self-contained HTML document. Every dynamic
 * value is HTML-escaped at the point of insertion, so client-supplied text can
 * never break the layout or inject markup.
 */

export interface InvoiceMetaRow {
    label: string
    value: string
}

export interface InvoiceLineView {
    amount: string
    description: string
    details: string[]
    meta: string
    quantity: string
    tax: string
    unitPrice: string
}

export interface InvoicePaymentBlock {
    body: string
    title: string
}

/** The optional second page: structured remittance details for getting paid. */
export interface InvoicePaymentPage {
    bankRows: InvoiceMetaRow[]
    contextLine: string
    depositNote: string
    onlineRows: InvoiceMetaRow[]
    reference: string
    title: string
}

export interface InvoiceTotalsView {
    currencyNote: string
    subtotal: string
    tax: string
    totalDue: string
    totalDueLabel: string
}

export interface InvoiceView {
    business: {
        contactLines: string[]
        name: string
    }
    client: {
        heading: string
        subLines: string[]
    }
    detailRows: InvoiceMetaRow[]
    footerText: string
    identityRows: InvoiceMetaRow[]
    items: InvoiceLineView[]
    logoDataUri: string | null
    notes: string
    paymentBlocks: InvoicePaymentBlock[]
    paymentPage: InvoicePaymentPage | null
    showTax: boolean
    title: string
    totals: InvoiceTotalsView
}

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)

const renderKeyValues = (rows: InvoiceMetaRow[], className: string): string => {
    if (rows.length === 0) {
        return ''
    }
    const body = rows.map((row) => `<dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd>`).join('')
    return `<dl class="${className}">${body}</dl>`
}

const renderContactLines = (lines: string[]): string =>
    lines.map((line) => `<div class="contact-line">${escapeHtml(line)}</div>`).join('')

const renderLineItem = (item: InvoiceLineView, showTax: boolean): string => {
    const meta = item.meta ? `<div class="item-meta">${escapeHtml(item.meta)}</div>` : ''
    const details = item.details.length
        ? `<ul class="item-details">${item.details.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
        : ''
    const taxCell = showTax ? `<td class="num tax">${escapeHtml(item.tax)}</td>` : ''
    return [
        '<tr>',
        `<td class="desc"><div class="item-desc">${escapeHtml(item.description)}</div>${details}${meta}</td>`,
        `<td class="num qty">${escapeHtml(item.quantity)}</td>`,
        `<td class="num price">${escapeHtml(item.unitPrice)}</td>`,
        taxCell,
        `<td class="num amount">${escapeHtml(item.amount)}</td>`,
        '</tr>',
    ].join('')
}

const renderPaymentBlocks = (blocks: InvoicePaymentBlock[]): string => {
    if (blocks.length === 0) {
        return ''
    }
    const body = blocks
        .map(
            (block) =>
                `<div class="pay-block"><div class="pay-title">${escapeHtml(block.title)}</div>` +
                `<div class="pay-body">${escapeHtml(block.body)}</div></div>`,
        )
        .join('')
    return `<div class="payment">${body}</div>`
}

const renderPaymentPage = (page: InvoicePaymentPage | null, footer: string): string => {
    if (!page) {
        return ''
    }
    const section = (title: string, inner: string): string =>
        inner ? `<div class="pay-section"><div class="section-label">${escapeHtml(title)}</div>${inner}</div>` : ''
    const body = (text: string): string => (text ? `<div class="body">${escapeHtml(text)}</div>` : '')

    const sections = [
        section('Bank transfer', renderKeyValues(page.bankRows, 'kv')),
        section('Pay online', renderKeyValues(page.onlineRows, 'kv')),
        section('Reference', body(page.reference)),
        section('Deposit', body(page.depositNote)),
    ].join('')

    return `<section class="pay-page">
        <div class="pay-page-head">
            <div class="pp-title">${escapeHtml(page.title)}</div>
            <div class="pp-context">${escapeHtml(page.contextLine)}</div>
        </div>
        ${sections}
        ${footer}
    </section>`
}

const buildStyles = (theme: PdfTheme): string => {
    const { color, font, page, size, space, table } = theme
    return `
        @page { size: ${page.size}; margin: ${page.margin}; }

        * { box-sizing: border-box; }

        html, body {
            margin: 0;
            padding: 0;
            background: ${color.paper};
            color: ${color.ink};
            font-family: ${font.family};
            font-size: ${size.body};
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
        }

        .sheet { width: 100%; }

        .section-label {
            font-size: ${size.sectionLabel};
            font-weight: ${font.weight.semibold};
            letter-spacing: 0.09em;
            text-transform: uppercase;
            color: ${color.subtle};
            margin: 0 0 ${space.sm} 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: ${space.xl};
        }

        .brand { max-width: 58%; }
        .brand .logo { max-height: 52px; max-width: 220px; margin-bottom: ${space.md}; }
        .brand .biz-name {
            font-size: ${size.bodyLarge};
            font-weight: ${font.weight.semibold};
            color: ${color.strong};
            letter-spacing: 0.01em;
            margin-bottom: ${space.sm};
            overflow-wrap: anywhere;
        }
        .contact-line { color: ${color.muted}; font-size: ${size.small}; }

        .identity { text-align: right; flex-shrink: 0; }
        .identity .title {
            font-size: ${size.title};
            font-weight: ${font.weight.bold};
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: ${color.accent};
            line-height: 1;
            margin-bottom: ${space.md};
        }

        dl.kv {
            display: grid;
            grid-template-columns: auto auto;
            column-gap: ${space.md};
            row-gap: ${space.xs};
            margin: 0;
        }
        dl.kv dt { color: ${color.muted}; font-size: ${size.small}; }
        dl.kv dd {
            margin: 0;
            color: ${color.ink};
            font-size: ${size.small};
            font-weight: ${font.weight.medium};
            font-variant-numeric: tabular-nums;
        }
        dl.kv.right { justify-content: end; }
        dl.kv.right dt, dl.kv.right dd { text-align: right; }

        .rule { height: 2px; background: ${color.accent}; border: 0; margin: ${space.lg} 0 ${space.xl} 0; }

        .parties {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: ${space.xl};
            margin-bottom: ${space.xl};
        }
        .bill-to { max-width: 55%; }
        .bill-to .client-name {
            font-size: ${size.bodyLarge};
            font-weight: ${font.weight.semibold};
            color: ${color.strong};
            margin-bottom: ${space.xs};
            overflow-wrap: anywhere;
        }
        .bill-to .client-line { color: ${color.muted}; font-size: ${size.small}; }
        .details { text-align: right; flex-shrink: 0; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: ${space.lg};
        }
        table.items thead th {
            font-size: ${size.tableHeader};
            font-weight: ${font.weight.semibold};
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: ${color.muted};
            text-align: left;
            padding: 0 ${table.cellPaddingX} ${table.headerPaddingY} ${table.cellPaddingX};
            border-bottom: 1.5px solid ${color.hairlineStrong};
        }
        table.items thead th:first-child { padding-left: 0; }
        table.items thead th:last-child { padding-right: 0; }
        table.items th.num, table.items td.num { text-align: right; font-variant-numeric: tabular-nums; }
        table.items td {
            padding: ${table.rowPaddingY} ${table.cellPaddingX};
            border-bottom: 1px solid ${color.hairline};
            vertical-align: top;
        }
        table.items td:first-child { padding-left: 0; }
        table.items td:last-child { padding-right: 0; }
        table.items tr { break-inside: avoid; }
        td.desc { width: 46%; }
        td.num { white-space: nowrap; }
        .item-desc { color: ${color.ink}; overflow-wrap: anywhere; }
        .item-meta { color: ${color.subtle}; font-size: ${size.small}; margin-top: 2px; }
        .item-details { margin: ${space.xs} 0 0 0; padding-left: 1.1em; color: ${color.muted}; font-size: ${size.small}; }
        .item-details li { margin: 1px 0; overflow-wrap: anywhere; }

        col.col-desc { width: 46%; }
        col.col-qty { width: 11%; }
        col.col-price { width: 15%; }
        col.col-tax { width: 12%; }
        col.col-amount { width: 16%; }

        .summary { display: flex; justify-content: flex-end; margin-bottom: ${space.xl}; }
        .totals { width: 46%; min-width: 240px; }
        .total-row { display: flex; justify-content: space-between; padding: ${space.xs} 0; }
        .total-row .label { color: ${color.muted}; font-size: ${size.totalLabel}; }
        .total-row .value { color: ${color.ink}; font-size: ${size.totalLabel}; font-variant-numeric: tabular-nums; }
        .total-due {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-top: ${space.sm};
            padding-top: ${space.md};
            border-top: 2px solid ${color.accent};
        }
        .total-due .label {
            font-size: ${size.totalDueLabel};
            font-weight: ${font.weight.semibold};
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: ${color.strong};
        }
        .total-due .value {
            font-size: ${size.totalDueValue};
            font-weight: ${font.weight.bold};
            color: ${color.strong};
            font-variant-numeric: tabular-nums;
        }
        .currency-note { text-align: right; color: ${color.subtle}; font-size: ${size.micro}; margin-top: ${space.sm}; }

        .closing { display: flex; gap: ${space.xl}; margin-bottom: ${space.xl}; }
        .notes { flex: 1; }
        .notes .body { color: ${color.muted}; font-size: ${size.small}; white-space: pre-line; }
        .payment { flex: 1; display: flex; flex-direction: column; gap: ${space.md}; }
        .pay-block .pay-title {
            font-size: ${size.sectionLabel};
            font-weight: ${font.weight.semibold};
            letter-spacing: 0.09em;
            text-transform: uppercase;
            color: ${color.subtle};
            margin-bottom: ${space.xs};
        }
        .pay-block .pay-body { color: ${color.muted}; font-size: ${size.small}; white-space: pre-line; }

        .footer {
            margin-top: ${space.xxl};
            padding-top: ${space.md};
            border-top: 1px solid ${color.hairline};
            text-align: center;
            color: ${color.subtle};
            font-size: ${size.micro};
            white-space: pre-line;
        }

        .pay-page { break-before: page; padding-top: ${space.sm}; }
        .pay-page-head { margin-bottom: ${space.xl}; }
        .pay-page-head .pp-title {
            font-size: ${size.title};
            font-weight: ${font.weight.bold};
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: ${color.accent};
            line-height: 1;
        }
        .pay-page-head .pp-context { color: ${color.muted}; font-size: ${size.small}; margin-top: ${space.sm}; }
        .pay-section { max-width: 480px; margin-bottom: ${space.xl}; }
        .pay-section .body { color: ${color.muted}; font-size: ${size.small}; white-space: pre-line; }
        .pay-section dl.kv { column-gap: ${space.xl}; row-gap: ${space.sm}; }
        .pay-section dl.kv dd { color: ${color.strong}; }
    `
}

export const renderInvoiceDocument = (view: InvoiceView, theme: PdfTheme): string => {
    const logo = view.logoDataUri
        ? `<img class="logo" src="${escapeHtml(view.logoDataUri)}" alt="${escapeHtml(view.business.name)}" />`
        : ''

    const taxHeader = view.showTax ? '<th class="num">Tax</th>' : ''
    const taxCol = view.showTax ? '<col class="col-tax" />' : ''

    const clientSub = view.client.subLines.map((line) => `<div class="client-line">${escapeHtml(line)}</div>`).join('')

    const detailsBlock =
        view.detailRows.length > 0
            ? `<div class="details"><div class="section-label">Details</div>${renderKeyValues(view.detailRows, 'kv right')}</div>`
            : ''

    const notesSection = view.notes
        ? `<div class="notes"><div class="section-label">Notes</div><div class="body">${escapeHtml(view.notes)}</div></div>`
        : ''
    const paymentSection = renderPaymentBlocks(view.paymentBlocks)
    const closing = notesSection || paymentSection ? `<div class="closing">${notesSection}${paymentSection}</div>` : ''

    const taxRow = view.showTax
        ? `<div class="total-row"><span class="label">Tax</span><span class="value">${escapeHtml(view.totals.tax)}</span></div>`
        : ''
    const currencyNote = view.totals.currencyNote
        ? `<div class="currency-note">${escapeHtml(view.totals.currencyNote)}</div>`
        : ''
    const footer = view.footerText ? `<footer class="footer">${escapeHtml(view.footerText)}</footer>` : ''

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(view.title)} ${escapeHtml(view.identityRows[0]?.value ?? '')}</title>
<style>${buildStyles(theme)}</style>
</head>
<body>
<main class="sheet">
    <header class="header">
        <div class="brand">
            ${logo}
            <div class="biz-name">${escapeHtml(view.business.name)}</div>
            ${renderContactLines(view.business.contactLines)}
        </div>
        <div class="identity">
            <div class="title">${escapeHtml(view.title)}</div>
            ${renderKeyValues(view.identityRows, 'kv right')}
        </div>
    </header>

    <hr class="rule" />

    <section class="parties">
        <div class="bill-to">
            <div class="section-label">Bill to</div>
            <div class="client-name">${escapeHtml(view.client.heading)}</div>
            ${clientSub}
        </div>
        ${detailsBlock}
    </section>

    <table class="items">
        <colgroup>
            <col class="col-desc" />
            <col class="col-qty" />
            <col class="col-price" />
            ${taxCol}
            <col class="col-amount" />
        </colgroup>
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Qty</th>
                <th class="num">Unit price</th>
                ${taxHeader}
                <th class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${view.items.map((item) => renderLineItem(item, view.showTax)).join('\n            ')}
        </tbody>
    </table>

    <section class="summary">
        <div class="totals">
            <div class="total-row"><span class="label">Subtotal</span><span class="value">${escapeHtml(view.totals.subtotal)}</span></div>
            ${taxRow}
            <div class="total-due"><span class="label">${escapeHtml(view.totals.totalDueLabel)}</span><span class="value">${escapeHtml(view.totals.totalDue)}</span></div>
            ${currencyNote}
        </div>
    </section>

    ${closing}
    ${footer}
    ${renderPaymentPage(view.paymentPage, footer)}
</main>
</body>
</html>`
}
