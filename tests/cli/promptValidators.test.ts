import { describe, expect, it } from 'vitest'

import {
    emailValidator,
    isoDateValidator,
    numberValidator,
    optionalIsoDateValidator,
    urlValidator,
} from '../../src/cli/prompts/prompt.js'

describe('isoDateValidator', () => {
    it('accepts a real calendar date', () => {
        expect(isoDateValidator('2026-07-09')).toBeUndefined()
    })

    it('rejects impossible and mis-formatted dates', () => {
        expect(isoDateValidator('2026-02-30')).toBeTruthy()
        expect(isoDateValidator('2026-13-01')).toBeTruthy()
        expect(isoDateValidator('07/09/2026')).toBeTruthy()
        expect(isoDateValidator('')).toBeTruthy()
    })
})

describe('optionalIsoDateValidator', () => {
    it('accepts an empty value', () => {
        expect(optionalIsoDateValidator('')).toBeUndefined()
    })

    it('still rejects an impossible date', () => {
        expect(optionalIsoDateValidator('2026-02-30')).toBeTruthy()
    })
})

describe('numberValidator', () => {
    it('rejects non-numbers and out-of-range values', () => {
        const rate = numberValidator({ label: 'Tax rate', min: 0, max: 100 })
        expect(rate('abc')).toBeTruthy()
        expect(rate('150')).toBeTruthy()
        expect(rate('8.5')).toBeUndefined()
    })

    it('enforces greater-than-zero when allowZero is false', () => {
        const qty = numberValidator({ label: 'Quantity', min: 0, allowZero: false })
        expect(qty('0')).toBeTruthy()
        expect(qty('1')).toBeUndefined()
    })
})

describe('emailValidator / urlValidator', () => {
    it('allow empty but reject malformed input', () => {
        expect(emailValidator('')).toBeUndefined()
        expect(emailValidator('nope')).toBeTruthy()
        expect(emailValidator('a@b.co')).toBeUndefined()
        expect(urlValidator('')).toBeUndefined()
        expect(urlValidator('example.com')).toBeTruthy()
        expect(urlValidator('https://example.com')).toBeUndefined()
    })
})
