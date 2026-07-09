import { emptyBusinessProfile } from '../../config/configSchema.js'
import type { BusinessProfile } from '../../invoice/invoiceTypes.js'
import { askText, emailValidator, requiredValidator, urlValidator } from './prompt.js'

/**
 * Collects the sender's business details. Existing values (from config) are
 * offered as defaults, so re-running init or overriding per-invoice is fast.
 */
export const askBusinessProfile = async (
    defaults: BusinessProfile = emptyBusinessProfile(),
): Promise<BusinessProfile> => {
    const name = await askText({
        message: 'Business name',
        placeholder: 'Colten Krauter',
        initialValue: defaults.name,
        validate: requiredValidator('Business name'),
    })
    const contactName = await askText({ message: 'Contact name (optional)', initialValue: defaults.contactName })
    const email = await askText({
        message: 'Email',
        placeholder: 'hello@coltenkrauter.com',
        initialValue: defaults.email,
        validate: emailValidator,
    })
    const phone = await askText({ message: 'Phone (optional)', initialValue: defaults.phone })
    const website = await askText({
        message: 'Website (optional)',
        placeholder: 'https://coltenkrauter.com',
        initialValue: defaults.website,
        validate: urlValidator,
    })
    const line1 = await askText({ message: 'Address line 1 (optional)', initialValue: defaults.address.line1 })
    const line2 = await askText({ message: 'Address line 2 (optional)', initialValue: defaults.address.line2 })
    const city = await askText({ message: 'City (optional)', initialValue: defaults.address.city })
    const state = await askText({ message: 'State or region (optional)', initialValue: defaults.address.state })
    const postalCode = await askText({ message: 'Postal code (optional)', initialValue: defaults.address.postalCode })
    const country = await askText({ message: 'Country (optional)', initialValue: defaults.address.country })
    const taxId = await askText({ message: 'Tax ID (optional)', initialValue: defaults.taxId })
    const paymentInstructions = await askText({
        message: 'Default payment instructions (optional)',
        placeholder: 'Pay by ACH or check.',
        initialValue: defaults.paymentInstructions,
    })
    const logoPath = await askText({ message: 'Logo path (optional)', initialValue: defaults.logoPath })

    return {
        address: { city, country, line1, line2, postalCode, state },
        contactName,
        email,
        logoPath,
        name,
        paymentInstructions,
        phone,
        taxId,
        website,
    }
}
