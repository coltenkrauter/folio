import type { ClientProfile } from '../../invoice/invoiceTypes.js'
import { askText, emailValidator } from './prompt.js'

/**
 * Collects the client (bill-to) details. At least one of client business name
 * or contact name is required; the schema enforces this on the final invoice,
 * and the prompts nudge toward filling the business name first.
 */
export const askClientProfile = async (): Promise<ClientProfile> => {
    const businessName = await askText({ message: 'Client business name', placeholder: 'Perpetual Stew Tavern' })
    const name = await askText({
        message: businessName ? 'Client contact name (optional)' : 'Client name',
        placeholder: 'Bartholomew Quince',
        validate: businessName ? undefined : requiredWhenNoBusiness,
    })
    const email = await askText({ message: 'Client email (optional)', validate: emailValidator })
    const phone = await askText({ message: 'Client phone (optional)' })
    const line1 = await askText({ message: 'Client address line 1 (optional)' })
    const line2 = await askText({ message: 'Client address line 2 (optional)' })
    const city = await askText({ message: 'Client city (optional)' })
    const state = await askText({ message: 'Client state or region (optional)' })
    const postalCode = await askText({ message: 'Client postal code (optional)' })
    const country = await askText({ message: 'Client country (optional)' })

    return {
        address: { city, country, line1, line2, postalCode, state },
        businessName,
        email,
        name,
        phone,
    }
}

const requiredWhenNoBusiness = (value: string): string | undefined =>
    value.trim().length > 0 ? undefined : 'Enter a client name or a client business name.'
