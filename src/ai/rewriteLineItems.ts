import type { InvoiceLineItem } from '../invoice/invoiceTypes.js'
import type { AiProvider } from './aiProvider.js'
import type { AiRewriteChoice, AiRewriteRequest } from './aiTypes.js'

export interface LineItemRewrite {
    index: number
    original: string
    suggestion: string
}

/** Builds a minimal rewrite request from line items — descriptions only. */
export const buildRewriteRequest = (items: InvoiceLineItem[], tone?: string): AiRewriteRequest => ({
    items: items.map((item, index) => ({ id: String(index), original: item.description })),
    ...(tone ? { tone } : {}),
})

/**
 * Requests improved wording for every line item and returns proposals aligned
 * to the original items by index. Missing or empty suggestions fall back to the
 * original text, so a partial model response never drops a line item.
 */
export const rewriteInvoiceLineItems = async (
    provider: AiProvider,
    items: InvoiceLineItem[],
    tone?: string,
): Promise<LineItemRewrite[]> => {
    const response = await provider.rewriteLineItems(buildRewriteRequest(items, tone))
    const suggestionsById = new Map(response.suggestions.map((s) => [s.id, s.suggestion]))

    return items.map((item, index) => {
        const suggestion = suggestionsById.get(String(index))?.trim()
        return {
            index,
            original: item.description,
            suggestion: suggestion && suggestion.length > 0 ? suggestion : item.description,
        }
    })
}

export interface ApplyRewriteChoiceInput {
    choice: AiRewriteChoice
    editedText?: string
    original: string
    suggestion: string
}

/**
 * Pure resolution of an approval decision to final text. AI output is never
 * applied unless the user accepts it or supplies their own edit; reject and
 * retry both preserve the original wording.
 */
export const applyRewriteChoice = (input: ApplyRewriteChoiceInput): string => {
    switch (input.choice) {
        case 'accept':
            return input.suggestion.trim() || input.original
        case 'edit':
            return input.editedText?.trim() || input.original
        case 'reject':
        case 'retry':
            return input.original
    }
}
