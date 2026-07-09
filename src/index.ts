/**
 * Folio's public, programmatic API. The CLI is the primary interface, but every
 * piece of core logic is exported here so Folio can be used as a library too
 * (e.g. render an invoice from your own script).
 */

// Invoice domain
export { calculateInvoiceTotals, calculateLineTotals, invoiceHasTax } from './invoice/calculateInvoiceTotals.js'
export { createInvoice, type CreateInvoiceInput } from './invoice/createInvoice.js'
export { normalizeInvoice } from './invoice/normalizeInvoice.js'
export { deserializeInvoice, serializeInvoice } from './invoice/serializeInvoice.js'
export {
    validateInvoice,
    type InvoiceValidationFailure,
    type InvoiceValidationResult,
    type InvoiceValidationSuccess,
} from './invoice/validateInvoice.js'
export {
    addressSchema,
    businessProfileSchema,
    clientProfileSchema,
    currencyCodeSchema,
    invoiceLineItemSchema,
    invoiceMetadataSchema,
    invoiceSchema,
    invoiceTotalsSchema,
    paymentDetailsSchema,
    SUPPORTED_CURRENCIES,
} from './invoice/invoiceSchema.js'
export type {
    Address,
    BusinessProfile,
    ClientProfile,
    CurrencyCode,
    Invoice,
    InvoiceLineItem,
    InvoiceMetadata,
    InvoiceTotals,
    LineItemTotals,
    PaymentDetails,
} from './invoice/invoiceTypes.js'

// Config
export { configPath, folioDir } from './config/configPaths.js'
export {
    createDefaultConfig,
    DEFAULT_OPENROUTER_MODEL,
    DEFAULT_PAYMENT_TERMS,
    emptyBusinessProfile,
    folioConfigSchema,
} from './config/configSchema.js'
export { configExists, loadConfig } from './config/loadConfig.js'
export { saveConfig } from './config/saveConfig.js'
export type { FolioConfig } from './config/configTypes.js'

// AI
export {
    DEFAULT_OPENROUTER_MODEL as DEFAULT_AI_MODEL,
    isAiConfigured,
    readAiEnv,
    resolveAiProvider,
    type AiProvider,
} from './ai/aiProvider.js'
export { createOpenRouterProvider } from './ai/openRouterProvider.js'
export { applyRewriteChoice, buildRewriteRequest, rewriteInvoiceLineItems } from './ai/rewriteLineItems.js'
export type { AiRewriteChoice, AiRewriteRequest, AiRewriteResponse, AiRewriteSuggestion } from './ai/aiTypes.js'

// PDF
export { createPdfTheme, type PdfTheme } from './pdf/pdfTheme.js'
export { renderInvoiceHtml, type RenderInvoiceOptions } from './pdf/renderInvoiceHtml.js'
export { renderInvoicePdfBytes, renderInvoicePdfToFile, type RenderInvoicePdfOptions } from './pdf/renderInvoicePdf.js'
export { isBrowserAvailable, resolveChromiumExecutable } from './pdf/pdfRenderer.js'

// Shared
export { FolioError, isFolioError, type FolioErrorCode } from './shared/errors.js'
export { formatCurrency, toMinorUnits } from './shared/formatCurrency.js'
export { addDaysIso, formatDate, todayIso } from './shared/formatDate.js'
export { invoiceFileBase, slugify } from './shared/slugify.js'
