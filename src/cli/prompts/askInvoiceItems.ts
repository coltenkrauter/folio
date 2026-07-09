import { log } from '@clack/prompts'

import type { InvoiceLineItem } from '../../invoice/invoiceTypes.js'
import {
    askConfirm,
    askText,
    numberValidator,
    optionalIsoDateValidator,
    parseNumber,
    requiredValidator,
} from './prompt.js'

const askSingleItem = async (index: number): Promise<InvoiceLineItem> => {
    log.step(`Line item ${index + 1}`)

    const description = await askText({
        message: 'Description',
        placeholder: 'Technical setup, configuration, and support',
        validate: requiredValidator('Description'),
    })
    const quantity = await askText({
        message: 'Quantity',
        initialValue: '1',
        validate: numberValidator({ allowZero: false, label: 'Quantity', min: 0 }),
    })
    const unitPrice = await askText({
        message: 'Unit price',
        placeholder: '125',
        validate: numberValidator({ label: 'Unit price', min: 0 }),
    })
    const taxRate = await askText({
        message: 'Tax rate % (optional)',
        initialValue: '0',
        validate: numberValidator({ label: 'Tax rate', max: 100, min: 0 }),
    })
    const serviceDate = await askText({
        message: 'Service date YYYY-MM-DD (optional)',
        validate: optionalIsoDateValidator,
    })
    const category = await askText({ message: 'Category (optional)' })

    return {
        category,
        description,
        quantity: parseNumber(quantity),
        serviceDate,
        taxRate: parseNumber(taxRate),
        unitPrice: parseNumber(unitPrice),
    }
}

/** Collects one or more line items, looping until the user is done. */
export const askInvoiceItems = async (): Promise<InvoiceLineItem[]> => {
    const items: InvoiceLineItem[] = []

    do {
        items.push(await askSingleItem(items.length))
    } while (await askConfirm('Add another line item?', false))

    return items
}
