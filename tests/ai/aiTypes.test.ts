import { describe, expect, it } from 'vitest'

import { aiModelResponseSchema, aiRewriteChoiceSchema } from '../../src/ai/aiTypes.js'

describe('aiModelResponseSchema', () => {
    it('accepts a well-formed model response', () => {
        const result = aiModelResponseSchema.safeParse({ items: [{ id: '0', suggestion: 'Clear wording' }] })
        expect(result.success).toBe(true)
    })

    it('defaults to an empty item list', () => {
        expect(aiModelResponseSchema.parse({}).items).toEqual([])
    })

    it('rejects a blank suggestion', () => {
        expect(aiModelResponseSchema.safeParse({ items: [{ id: '0', suggestion: '   ' }] }).success).toBe(false)
    })

    it('rejects a missing id', () => {
        expect(aiModelResponseSchema.safeParse({ items: [{ suggestion: 'x' }] }).success).toBe(false)
    })
})

describe('aiRewriteChoiceSchema', () => {
    it('accepts the four supported choices', () => {
        for (const choice of ['accept', 'edit', 'reject', 'retry']) {
            expect(aiRewriteChoiceSchema.safeParse(choice).success).toBe(true)
        }
    })

    it('rejects anything else', () => {
        expect(aiRewriteChoiceSchema.safeParse('apply').success).toBe(false)
    })
})
