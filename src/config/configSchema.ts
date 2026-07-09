import { z } from 'zod'

import { businessProfileSchema, currencyCodeSchema } from '../invoice/invoiceSchema.js'
import type { Address, BusinessProfile, CurrencyCode } from '../invoice/invoiceTypes.js'
import type { FolioConfig } from './configTypes.js'

/**
 * Folio config is intentionally small: reusable business details plus a few
 * invoice defaults. It never stores secrets — the OpenRouter API key is read
 * from the environment only, never persisted here.
 */

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4.1-mini'
export const DEFAULT_PAYMENT_TERMS = 'Due on receipt'

export const accentColorSchema = z.string().trim().regex(HEX_COLOR, 'Use a hex color like #1a1a1a or #333.')

export const folioConfigSchema = z.object({
    accentColor: accentColorSchema.optional(),
    business: businessProfileSchema,
    defaultCurrency: currencyCodeSchema.default('USD'),
    defaultPaymentTerms: z.string().trim().default(DEFAULT_PAYMENT_TERMS),
    openRouterModel: z.string().trim().default(DEFAULT_OPENROUTER_MODEL),
    outputDir: z.string().trim().default('invoices'),
    version: z.literal(1).default(1),
})

export const emptyAddress = (): Address => ({
    city: '',
    country: '',
    line1: '',
    line2: '',
    postalCode: '',
    state: '',
})

export interface DefaultConfigOverrides {
    accentColor?: string
    defaultCurrency?: CurrencyCode
    defaultPaymentTerms?: string
    openRouterModel?: string
    outputDir?: string
}

/** Builds a complete, valid config from a business profile and optional overrides. */
export const createDefaultConfig = (
    business: BusinessProfile,
    overrides: DefaultConfigOverrides = {},
): FolioConfig => ({
    ...(overrides.accentColor ? { accentColor: overrides.accentColor } : {}),
    business,
    defaultCurrency: overrides.defaultCurrency ?? 'USD',
    defaultPaymentTerms: overrides.defaultPaymentTerms ?? DEFAULT_PAYMENT_TERMS,
    openRouterModel: overrides.openRouterModel ?? DEFAULT_OPENROUTER_MODEL,
    outputDir: overrides.outputDir ?? 'invoices',
    version: 1,
})

export const emptyBusinessProfile = (): BusinessProfile => ({
    address: emptyAddress(),
    contactName: '',
    email: '',
    logoPath: '',
    name: '',
    paymentInstructions: '',
    phone: '',
    taxId: '',
    website: '',
})
