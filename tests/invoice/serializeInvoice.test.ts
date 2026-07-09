import { describe, expect, it } from 'vitest'

import { deserializeInvoice, serializeInvoice } from '../../src/invoice/serializeInvoice.js'
import { sampleInvoice } from '../support/fixtures.js'

describe('serializeInvoice', () => {
    it('produces deterministic output regardless of key insertion order', () => {
        const invoice = sampleInvoice()
        const shuffled = JSON.parse(JSON.stringify(invoice))
        const reordered = {
            payment: shuffled.payment,
            items: shuffled.items,
            metadata: shuffled.metadata,
            client: shuffled.client,
            business: shuffled.business,
        }
        expect(serializeInvoice(invoice)).toBe(serializeInvoice(reordered as typeof invoice))
    })

    it('alphabetizes keys and ends with a trailing newline', () => {
        const output = serializeInvoice(sampleInvoice())
        expect(output.endsWith('\n')).toBe(true)
        const topLevelKeys = Object.keys(JSON.parse(output))
        expect(topLevelKeys).toEqual([...topLevelKeys].sort())
    })

    it('round-trips through deserializeInvoice', () => {
        const invoice = sampleInvoice()
        const restored = deserializeInvoice(serializeInvoice(invoice))
        expect(restored).toEqual(invoice)
    })
})
