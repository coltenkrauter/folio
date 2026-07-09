import { SUPPORTED_CURRENCIES } from '../../invoice/invoiceSchema.js'
import type { CurrencyCode, InvoiceMetadata } from '../../invoice/invoiceTypes.js'
import { addDaysIso, todayIso } from '../../shared/formatDate.js'
import { askSelect, askText, isoDateValidator, requiredValidator, type SelectOption } from './prompt.js'

export interface InvoiceMetadataDefaults {
    currency: CurrencyCode
    paymentTerms: string
}

interface TermPreset {
    label: string
    netDays: number
    value: string
}

const TERM_PRESETS: TermPreset[] = [
    { label: 'Due on receipt', netDays: 0, value: 'Due on receipt' },
    { label: 'Net 7', netDays: 7, value: 'Net 7' },
    { label: 'Net 15', netDays: 15, value: 'Net 15' },
    { label: 'Net 30', netDays: 30, value: 'Net 30' },
    { label: 'Net 60', netDays: 60, value: 'Net 60' },
]

const CUSTOM_TERM = '__custom__'

const currencyOptions: SelectOption<CurrencyCode>[] = SUPPORTED_CURRENCIES.map((code) => ({ label: code, value: code }))

const suggestedInvoiceNumber = (issueDate: string): string => `INV-${issueDate.slice(0, 4)}-001`

const netDaysForTerms = (terms: string): number => {
    const preset = TERM_PRESETS.find((option) => option.value === terms)
    if (preset) {
        return preset.netDays
    }
    const match = /net\s*(\d+)/i.exec(terms)
    return match ? Number(match[1]) : 0
}

/** Collects invoice metadata, deriving a sensible due date from the terms. */
export const askInvoiceMetadata = async (defaults: InvoiceMetadataDefaults): Promise<InvoiceMetadata> => {
    const currency = await askSelect('Currency', currencyOptions, defaults.currency)

    const issueDate = await askText({
        message: 'Issue date',
        initialValue: todayIso(),
        validate: isoDateValidator,
    })

    const invoiceNumber = await askText({
        message: 'Invoice number',
        initialValue: suggestedInvoiceNumber(issueDate),
        validate: requiredValidator('Invoice number'),
    })

    const termChoice = await askSelect<string>(
        'Payment terms',
        [
            ...TERM_PRESETS.map((preset) => ({ label: preset.label, value: preset.value })),
            { label: 'Other…', value: CUSTOM_TERM },
        ],
        TERM_PRESETS.some((preset) => preset.value === defaults.paymentTerms) ? defaults.paymentTerms : CUSTOM_TERM,
    )
    const paymentTerms =
        termChoice === CUSTOM_TERM
            ? await askText({
                  message: 'Describe the payment terms',
                  initialValue: defaults.paymentTerms,
                  validate: requiredValidator('Payment terms'),
              })
            : termChoice

    const dueDate = await askText({
        message: 'Due date',
        initialValue: addDaysIso(netDaysForTerms(paymentTerms), issueDate),
        validate: isoDateValidator,
    })

    const purchaseOrderNumber = await askText({ message: 'PO number (optional)' })
    const projectName = await askText({ message: 'Project name (optional)' })
    const notes = await askText({
        message: 'Notes (optional)',
        initialValue: 'Thank you for your business.',
    })
    const footerText = await askText({ message: 'Footer text (optional)' })

    return {
        currency,
        dueDate,
        footerText,
        invoiceNumber,
        issueDate,
        notes,
        paymentTerms,
        projectName,
        purchaseOrderNumber,
    }
}
