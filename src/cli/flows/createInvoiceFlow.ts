import { log, spinner } from '@clack/prompts'

import { isAiConfigured, resolveAiProvider, type AiProvider } from '../../ai/aiProvider.js'
import { applyRewriteChoice, rewriteInvoiceLineItems } from '../../ai/rewriteLineItems.js'
import type { FolioConfig } from '../../config/configTypes.js'
import { paymentHasContent } from '../../config/rememberInvoice.js'
import { createInvoice } from '../../invoice/createInvoice.js'
import { nextInvoiceNumber } from '../../invoice/nextInvoiceNumber.js'
import type {
    BusinessProfile,
    ClientProfile,
    Invoice,
    InvoiceLineItem,
    PaymentDetails,
} from '../../invoice/invoiceTypes.js'
import { toErrorMessage } from '../../shared/errors.js'
import { todayIso } from '../../shared/formatDate.js'
import { askAiApproval } from '../prompts/askAiApproval.js'
import { askBusinessProfile } from '../prompts/askBusinessProfile.js'
import { askClientProfile } from '../prompts/askClientProfile.js'
import { askInvoiceItems } from '../prompts/askInvoiceItems.js'
import { askInvoiceMetadata } from '../prompts/askInvoiceMetadata.js'
import { askPaymentDetails } from '../prompts/askPaymentDetails.js'
import { askConfirm, askSelect } from '../prompts/prompt.js'

export interface CreateInvoiceFlowOptions {
    ai: boolean
    config: FolioConfig | null
}

const resolveBusiness = async (config: FolioConfig | null): Promise<BusinessProfile> => {
    if (config?.business.name) {
        const useSaved = await askConfirm(`Use saved business profile (${config.business.name})?`, true)
        if (useSaved) {
            return config.business
        }
        return askBusinessProfile(config.business)
    }
    return askBusinessProfile()
}

const NEW_CLIENT = ' new-client'

const clientLabel = (client: ClientProfile): string => {
    const name = client.businessName || client.name
    const where = [client.address.city, client.address.state].filter(Boolean).join(', ')
    return where ? `${name} — ${where}` : name
}

/** Offers recently-billed clients as one-tap picks, with an escape hatch to enter a new one. */
const resolveClient = async (config: FolioConfig | null): Promise<ClientProfile> => {
    const recent = config?.recentClients ?? []
    if (recent.length === 0) {
        return askClientProfile()
    }
    const choice = await askSelect<string>(
        'Client',
        [
            { label: '+ Enter a new client', value: NEW_CLIENT },
            ...recent.map((client, index) => ({ label: clientLabel(client), value: String(index) })),
        ],
        NEW_CLIENT,
    )
    return choice === NEW_CLIENT ? askClientProfile() : (recent[Number(choice)] ?? askClientProfile())
}

/** Reuses saved payment details (bank/wire, reference, deposit) when present, else asks. */
const resolvePayment = async (
    config: FolioConfig | null,
    business: BusinessProfile,
    terms: string,
): Promise<PaymentDetails> => {
    const saved = config?.payment
    if (saved && paymentHasContent(saved) && (await askConfirm('Use saved payment details?', true))) {
        return { ...saved, terms }
    }
    return askPaymentDetails({ instructions: business.paymentInstructions ?? '', terms })
}

/** Re-requests a suggestion for a single line item during a retry. */
const retrySuggestion = async (provider: AiProvider, item: InvoiceLineItem, fallback: string): Promise<string> => {
    try {
        const [next] = await rewriteInvoiceLineItems(provider, [item])
        return next?.suggestion ?? fallback
    } catch {
        log.warn('Retry failed. Keeping the current wording.')
        return fallback
    }
}

/**
 * Runs the optional AI wording pass. Every suggestion requires explicit
 * approval, and any failure (no key, network, bad response) degrades to the
 * user's original wording without interrupting invoice creation.
 */
const applyAiAssistance = async (items: InvoiceLineItem[], config: FolioConfig | null): Promise<InvoiceLineItem[]> => {
    if (!isAiConfigured()) {
        log.warn('AI is unavailable — set OPENROUTER_API_KEY to enable it. Continuing without AI.')
        return items
    }

    if (!(await askConfirm('Use AI to improve line-item wording?', true))) {
        return items
    }

    let provider: AiProvider
    try {
        provider = resolveAiProvider(config?.openRouterModel ? { model: config.openRouterModel } : {})
    } catch (error) {
        log.warn(`${toErrorMessage(error)} Continuing without AI.`)
        return items
    }

    const progress = spinner()
    progress.start('Asking AI for clearer wording')
    let proposals
    try {
        proposals = await rewriteInvoiceLineItems(provider, items)
        progress.stop('AI suggestions ready')
    } catch (error) {
        progress.stop('AI request failed')
        log.warn(`${toErrorMessage(error)} Continuing with your wording.`)
        return items
    }

    const updated = [...items]
    for (const proposal of proposals) {
        if (proposal.suggestion.trim() === proposal.original.trim()) {
            continue
        }

        let suggestion = proposal.suggestion
        for (;;) {
            const { choice, editedText } = await askAiApproval(proposal.original, suggestion)
            if (choice === 'retry') {
                const item = items[proposal.index]
                if (item) {
                    suggestion = await retrySuggestion(provider, item, suggestion)
                }
                continue
            }

            const description = applyRewriteChoice({
                choice,
                original: proposal.original,
                suggestion,
                ...(editedText !== undefined ? { editedText } : {}),
            })
            const target = updated[proposal.index]
            if (target) {
                updated[proposal.index] = { ...target, description }
            }
            break
        }
    }

    return updated
}

/**
 * The end-to-end interactive invoice flow: business → client → metadata →
 * items → optional AI → payment. Returns a validated, canonical invoice.
 */
export const createInvoiceFlow = async (options: CreateInvoiceFlowOptions): Promise<Invoice> => {
    const { config } = options

    const business = await resolveBusiness(config)
    const client = await resolveClient(config)
    const metadata = await askInvoiceMetadata({
        currency: config?.defaultCurrency ?? 'USD',
        invoiceNumber: nextInvoiceNumber(config?.lastInvoiceNumber, todayIso().slice(0, 4)),
        paymentTerms: config?.defaultPaymentTerms ?? 'Due on receipt',
    })

    let items = await askInvoiceItems()
    if (options.ai) {
        items = await applyAiAssistance(items, config)
    }

    const payment = await resolvePayment(config, business, metadata.paymentTerms)

    return createInvoice({ business, client, items, metadata, payment })
}
