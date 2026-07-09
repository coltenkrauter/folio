import type { PaymentDetails } from '../../invoice/invoiceTypes.js'
import { askText } from './prompt.js'

export interface PaymentDetailsDefaults {
    instructions: string
    terms: string
}

/**
 * Collects payment details. Terms come from the invoice metadata (kept in sync),
 * and the default instructions come from the saved business profile so the user
 * usually just presses enter.
 */
export const askPaymentDetails = async (defaults: PaymentDetailsDefaults): Promise<PaymentDetails> => {
    const instructions = await askText({
        message: 'Payment instructions (optional)',
        placeholder: 'Pay by ACH or check.',
        initialValue: defaults.instructions,
    })
    const achInstructions = await askText({ message: 'ACH transfer details (optional)' })
    const checkInstructions = await askText({ message: 'Check mailing details (optional)' })
    const lateFeeNote = await askText({ message: 'Late fee note (optional)' })

    return {
        achInstructions,
        checkInstructions,
        instructions,
        lateFeeNote,
        terms: defaults.terms,
    }
}
