import type { ClientProfile, Invoice } from '../invoice/invoiceTypes.js'
import { MAX_RECENT_CLIENTS } from './configSchema.js'
import type { FolioConfig, SavedPayment } from './configTypes.js'

const clientKey = (client: ClientProfile): string =>
    `${client.businessName}|${client.name}|${client.email}`.toLowerCase().trim()

/** Puts the client at the front of a de-duplicated, capped most-recent list. */
export const upsertRecentClient = (client: ClientProfile, recent: ClientProfile[]): ClientProfile[] => {
    const key = clientKey(client)
    const withoutDupe = recent.filter((existing) => clientKey(existing) !== key)
    return [client, ...withoutDupe].slice(0, MAX_RECENT_CLIENTS)
}

export const paymentHasContent = (payment: SavedPayment): boolean =>
    Boolean(
        payment.instructions ||
        payment.achInstructions ||
        payment.checkInstructions ||
        payment.paypal ||
        payment.venmo ||
        payment.reference ||
        payment.depositNote ||
        Object.values(payment.bankTransfer).some(Boolean),
    )

/** The reusable payment fields, dropping the per-invoice `terms`. */
const toSavedPayment = (invoice: Invoice): SavedPayment => {
    const { achInstructions, bankTransfer, checkInstructions, depositNote, instructions, paypal, reference, venmo } =
        invoice.payment
    return { achInstructions, bankTransfer, checkInstructions, depositNote, instructions, paypal, reference, venmo }
}

/**
 * Returns a copy of the config that remembers this invoice for next time: the
 * invoice number (so the next one auto-increments), the client (added to the
 * recent list), and the payment details (so bank/wire info isn't re-entered).
 * Pure — the caller decides whether and where to persist the result.
 */
export const rememberInvoice = (config: FolioConfig, invoice: Invoice): FolioConfig => {
    const savedPayment = toSavedPayment(invoice)
    return {
        ...config,
        lastInvoiceNumber: invoice.metadata.invoiceNumber,
        recentClients: upsertRecentClient(invoice.client, config.recentClients ?? []),
        ...(paymentHasContent(savedPayment) ? { payment: savedPayment } : {}),
    }
}
