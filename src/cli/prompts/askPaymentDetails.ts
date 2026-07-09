import type { BankTransfer, PaymentDetails } from '../../invoice/invoiceTypes.js'
import { askConfirm, askText } from './prompt.js'

export interface PaymentDetailsDefaults {
    instructions: string
    terms: string
}

const emptyBankTransfer = (): BankTransfer => ({
    accountName: '',
    accountNumber: '',
    bankName: '',
    iban: '',
    routingNumber: '',
    swift: '',
})

/**
 * Optionally collects bank / wire details for the payment-details page. Gated
 * behind a yes/no so the common case (no bank details) stays a couple of keys.
 */
const askBankTransfer = async (): Promise<BankTransfer> => {
    if (!(await askConfirm('Add bank / wire details (adds a payment-details page)?', false))) {
        return emptyBankTransfer()
    }
    const accountName = await askText({ message: 'Account holder name', placeholder: 'Colten Krauter' })
    const bankName = await askText({ message: 'Bank name', placeholder: 'BECU (Boeing Employees Credit Union)' })
    const accountNumber = await askText({ message: 'Account number' })
    const routingNumber = await askText({ message: 'Routing number (ABA)' })
    const swift = await askText({ message: 'SWIFT / BIC (optional, for international wires)' })
    const iban = await askText({ message: 'IBAN (optional, for international wires)' })
    return { accountName, accountNumber, bankName, iban, routingNumber, swift }
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
    const paypal = await askText({ message: 'PayPal link or handle (optional)', placeholder: 'paypal.me/yourname' })
    const venmo = await askText({ message: 'Venmo link or handle (optional)', placeholder: 'venmo.com/u/yourname' })
    const reference = await askText({
        message: 'Payment reference note (optional)',
        placeholder: 'Include the invoice number with your payment',
    })
    const depositNote = await askText({
        message: 'Deposit note (optional)',
        placeholder: '50% deposit due before work begins',
    })
    const bankTransfer = await askBankTransfer()

    return {
        achInstructions,
        bankTransfer,
        checkInstructions,
        depositNote,
        instructions,
        paypal,
        reference,
        terms: defaults.terms,
        venmo,
    }
}
