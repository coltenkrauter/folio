import { describe, expect, it } from 'vitest'

import {
    accentColorSchema,
    createDefaultConfig,
    emptyBusinessProfile,
    folioConfigSchema,
} from '../../src/config/configSchema.js'

const business = { ...emptyBusinessProfile(), name: 'Colten Krauter' }

describe('folioConfigSchema', () => {
    it('applies defaults for a minimal config', () => {
        const config = folioConfigSchema.parse({ business })
        expect(config.defaultCurrency).toBe('USD')
        expect(config.defaultPaymentTerms).toBe('Due on receipt')
        expect(config.openRouterModel).toBe('openai/gpt-4.1-mini')
        expect(config.outputDir).toBe('invoices')
        expect(config.version).toBe(1)
    })

    it('never stores secrets: unknown keys are stripped', () => {
        const config = folioConfigSchema.parse({ business, openRouterApiKey: 'sk-should-not-persist' })
        expect(config).not.toHaveProperty('openRouterApiKey')
    })

    it('requires a business name', () => {
        expect(folioConfigSchema.safeParse({ business: emptyBusinessProfile() }).success).toBe(false)
    })

    it('keeps remembered fields (last invoice, payment, recent clients) when present', () => {
        const parsed = folioConfigSchema.parse({
            business,
            lastInvoiceNumber: 'INV-2026-004',
            payment: { bankTransfer: { bankName: 'BECU' }, reference: 'Include the invoice number' },
            recentClients: [{ address: {}, businessName: 'Perpetual Stew Tavern', email: '', name: '', phone: '' }],
        })
        expect(parsed.lastInvoiceNumber).toBe('INV-2026-004')
        expect(parsed.payment?.bankTransfer.bankName).toBe('BECU')
        expect(parsed.payment).not.toHaveProperty('terms')
        expect(parsed.recentClients).toHaveLength(1)
    })
})

describe('accentColorSchema', () => {
    it('accepts 3- and 6-digit hex colors', () => {
        expect(accentColorSchema.safeParse('#333').success).toBe(true)
        expect(accentColorSchema.safeParse('#2f5d50').success).toBe(true)
    })

    it('rejects non-hex values', () => {
        expect(accentColorSchema.safeParse('rebeccapurple').success).toBe(false)
        expect(accentColorSchema.safeParse('#12').success).toBe(false)
    })
})

describe('createDefaultConfig', () => {
    it('builds a valid config from a business profile', () => {
        const config = createDefaultConfig(business, { defaultCurrency: 'EUR', accentColor: '#2f5d50' })
        expect(folioConfigSchema.safeParse(config).success).toBe(true)
        expect(config.defaultCurrency).toBe('EUR')
        expect(config.accentColor).toBe('#2f5d50')
    })

    it('omits the accent color when not provided', () => {
        const config = createDefaultConfig(business)
        expect(config).not.toHaveProperty('accentColor')
    })
})
