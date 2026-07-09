import { z } from 'zod'

/**
 * AI types and schemas. Folio's AI feature does one thing: propose clearer
 * wording for line-item descriptions. It never sees prices, quantities, tax,
 * clients, or dates — only the description text and an optional tone hint.
 */

/** What the user decides to do with a single AI suggestion. */
export const aiRewriteChoiceSchema = z.enum(['accept', 'edit', 'reject', 'retry'])
export type AiRewriteChoice = z.infer<typeof aiRewriteChoiceSchema>

export const aiRewriteItemRequestSchema = z.object({
    id: z.string(),
    original: z.string(),
})

export const aiRewriteRequestSchema = z.object({
    items: z.array(aiRewriteItemRequestSchema),
    tone: z.string().optional(),
})
export type AiRewriteItemRequest = z.infer<typeof aiRewriteItemRequestSchema>
export type AiRewriteRequest = z.infer<typeof aiRewriteRequestSchema>

export const aiRewriteSuggestionSchema = z.object({
    id: z.string(),
    original: z.string(),
    suggestion: z.string(),
})

export const aiRewriteResponseSchema = z.object({
    suggestions: z.array(aiRewriteSuggestionSchema),
})
export type AiRewriteSuggestion = z.infer<typeof aiRewriteSuggestionSchema>
export type AiRewriteResponse = z.infer<typeof aiRewriteResponseSchema>

/**
 * The exact JSON shape the model is instructed to return. Kept separate from
 * {@link aiRewriteResponseSchema} because the model only sends `id` +
 * `suggestion`; the original text is re-attached locally, never trusted from
 * the model.
 */
export const aiModelResponseSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string(),
                suggestion: z.string().trim().min(1),
            }),
        )
        .default([]),
})
export type AiModelResponse = z.infer<typeof aiModelResponseSchema>
