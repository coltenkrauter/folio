import { describe, expect, it } from 'vitest'

import type { AiProvider } from '../../src/ai/aiProvider.js'
import type { AiRewriteRequest, AiRewriteResponse } from '../../src/ai/aiTypes.js'
import { applyRewriteChoice, buildRewriteRequest, rewriteInvoiceLineItems } from '../../src/ai/rewriteLineItems.js'
import type { InvoiceLineItem } from '../../src/invoice/invoiceTypes.js'

const item = (description: string): InvoiceLineItem => ({
    category: '',
    description,
    details: [],
    quantity: 1,
    serviceDate: '',
    taxRate: 0,
    unitPrice: 10,
})

const providerReturning = (response: AiRewriteResponse): AiProvider => ({
    model: 'test/model',
    name: 'test',
    async rewriteLineItems(_request: AiRewriteRequest) {
        return response
    },
})

describe('buildRewriteRequest', () => {
    it('sends only descriptions, keyed by index', () => {
        const request = buildRewriteRequest([item('a'), item('b')], 'friendly')
        expect(request.items).toEqual([
            { id: '0', original: 'a' },
            { id: '1', original: 'b' },
        ])
        expect(request.tone).toBe('friendly')
    })

    it('omits tone when not provided', () => {
        expect(buildRewriteRequest([item('a')])).not.toHaveProperty('tone')
    })
})

describe('rewriteInvoiceLineItems', () => {
    it('aligns suggestions to items by index', async () => {
        const provider = providerReturning({
            suggestions: [
                { id: '0', original: 'a', suggestion: 'Improved A' },
                { id: '1', original: 'b', suggestion: 'Improved B' },
            ],
        })
        const result = await rewriteInvoiceLineItems(provider, [item('a'), item('b')])
        expect(result.map((r) => r.suggestion)).toEqual(['Improved A', 'Improved B'])
    })

    it('falls back to the original when a suggestion is missing or blank', async () => {
        const provider = providerReturning({
            suggestions: [{ id: '0', original: 'a', suggestion: '   ' }],
        })
        const result = await rewriteInvoiceLineItems(provider, [item('a'), item('b')])
        expect(result[0]?.suggestion).toBe('a')
        expect(result[1]?.suggestion).toBe('b')
    })
})

describe('applyRewriteChoice (approval logic)', () => {
    it('accept uses the suggestion', () => {
        expect(applyRewriteChoice({ choice: 'accept', original: 'a', suggestion: 'b' })).toBe('b')
    })

    it('accept falls back to original when the suggestion is blank', () => {
        expect(applyRewriteChoice({ choice: 'accept', original: 'a', suggestion: '  ' })).toBe('a')
    })

    it('reject keeps the original', () => {
        expect(applyRewriteChoice({ choice: 'reject', original: 'a', suggestion: 'b' })).toBe('a')
    })

    it('retry keeps the original (until the user decides)', () => {
        expect(applyRewriteChoice({ choice: 'retry', original: 'a', suggestion: 'b' })).toBe('a')
    })

    it('edit uses the edited text', () => {
        expect(applyRewriteChoice({ choice: 'edit', editedText: ' custom ', original: 'a', suggestion: 'b' })).toBe(
            'custom',
        )
    })

    it('edit falls back to the original when the edit is empty', () => {
        expect(applyRewriteChoice({ choice: 'edit', editedText: '   ', original: 'a', suggestion: 'b' })).toBe('a')
    })
})
