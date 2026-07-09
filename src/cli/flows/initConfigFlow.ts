import { createDefaultConfig, DEFAULT_OPENROUTER_MODEL } from '../../config/configSchema.js'
import type { FolioConfig } from '../../config/configTypes.js'
import { SUPPORTED_CURRENCIES } from '../../invoice/invoiceSchema.js'
import type { CurrencyCode } from '../../invoice/invoiceTypes.js'
import { askBusinessProfile } from '../prompts/askBusinessProfile.js'
import { askSelect, askText, type SelectOption } from '../prompts/prompt.js'

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const currencyOptions: SelectOption<CurrencyCode>[] = SUPPORTED_CURRENCIES.map((code) => ({ label: code, value: code }))

const accentValidator = (value: string): string | undefined =>
    value.trim() === '' || HEX_COLOR.test(value.trim()) ? undefined : 'Use a hex color like #1a1a1a, or leave it blank.'

/**
 * Gathers business details and invoice defaults for the saved config. Existing
 * values are pre-filled so re-running `folio init` is an easy edit, not a
 * from-scratch retype.
 */
export const initConfigFlow = async (existing: FolioConfig | null): Promise<FolioConfig> => {
    const business = await askBusinessProfile(existing?.business)

    const defaultCurrency = await askSelect('Default currency', currencyOptions, existing?.defaultCurrency ?? 'USD')
    const defaultPaymentTerms = await askText({
        message: 'Default payment terms',
        initialValue: existing?.defaultPaymentTerms ?? 'Due on receipt',
    })
    const outputDir = await askText({
        message: 'Output directory for invoices',
        initialValue: existing?.outputDir ?? 'invoices',
    })
    const openRouterModel = await askText({
        message: 'Preferred OpenRouter model (used only with --ai)',
        initialValue: existing?.openRouterModel ?? DEFAULT_OPENROUTER_MODEL,
    })
    const accentColor = await askText({
        message: 'Accent color hex (optional)',
        placeholder: '#1a1a1a',
        initialValue: existing?.accentColor ?? '',
        validate: accentValidator,
    })

    return createDefaultConfig(business, {
        ...(accentColor ? { accentColor } : {}),
        defaultCurrency,
        defaultPaymentTerms,
        openRouterModel,
        outputDir,
    })
}
