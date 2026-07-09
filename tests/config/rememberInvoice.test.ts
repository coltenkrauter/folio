import { describe, expect, it } from 'vitest'

import { createDefaultConfig, emptyBusinessProfile } from '../../src/config/configSchema.js'
import { paymentHasContent, rememberInvoice, upsertRecentClient } from '../../src/config/rememberInvoice.js'
import type { ClientProfile } from '../../src/invoice/invoiceTypes.js'
import { sampleInvoice } from '../support/fixtures.js'

const baseConfig = () => createDefaultConfig({ ...emptyBusinessProfile(), name: 'Colten Krauter' })

describe('rememberInvoice', () => {
    it('remembers the invoice number and the client', () => {
        const invoice = sampleInvoice()
        const updated = rememberInvoice(baseConfig(), invoice)
        expect(updated.lastInvoiceNumber).toBe(invoice.metadata.invoiceNumber)
        expect(updated.recentClients?.[0]?.businessName).toBe(invoice.client.businessName)
    })

    it('remembers payment details without the per-invoice terms', () => {
        const invoice = sampleInvoice({ payment: { bankTransfer: { bankName: 'BECU' }, terms: 'Net 30' } })
        const updated = rememberInvoice(baseConfig(), invoice)
        expect(updated.payment?.bankTransfer.bankName).toBe('BECU')
        expect(updated.payment).not.toHaveProperty('terms')
    })

    it('does not save empty payment details', () => {
        const updated = rememberInvoice(baseConfig(), sampleInvoice({ payment: { terms: 'Net 30' } }))
        expect(updated.payment).toBeUndefined()
    })
})

describe('upsertRecentClient', () => {
    const client = (businessName: string): ClientProfile => ({ ...sampleInvoice().client, businessName })

    it('moves a repeat client to the front without duplicating', () => {
        const a = client('KCW')
        const b = client('Other Co')
        const list = upsertRecentClient(a, [b, a])
        expect(list).toHaveLength(2)
        expect(list[0]?.businessName).toBe('KCW')
    })

    it('caps the list at 8 most-recent clients', () => {
        let list: ClientProfile[] = []
        for (let i = 0; i < 12; i += 1) {
            list = upsertRecentClient(client(`Client ${i}`), list)
        }
        expect(list.length).toBeLessThanOrEqual(8)
        expect(list[0]?.businessName).toBe('Client 11')
    })
})

describe('paymentHasContent', () => {
    it('is false for all-empty payment and true when any field is set', () => {
        const empty = {
            achInstructions: '',
            bankTransfer: { accountName: '', accountNumber: '', bankName: '', iban: '', routingNumber: '', swift: '' },
            checkInstructions: '',
            depositNote: '',
            instructions: '',
            paypal: '',
            reference: '',
            venmo: '',
        }
        expect(paymentHasContent(empty)).toBe(false)
        expect(paymentHasContent({ ...empty, reference: 'Include the invoice number' })).toBe(true)
        expect(paymentHasContent({ ...empty, venmo: 'venmo.com/u/demo' })).toBe(true)
        expect(
            paymentHasContent({ ...empty, bankTransfer: { ...empty.bankTransfer, routingNumber: '325081403' } }),
        ).toBe(true)
    })
})
