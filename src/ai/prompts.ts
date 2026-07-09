import type { AiRewriteRequest } from './aiTypes.js'

/**
 * Prompt builders for line-item rewriting. The guardrails live here so the
 * model's job is narrow and predictable: improve wording, invent nothing.
 */

export const buildRewriteSystemPrompt = (): string =>
    [
        'You rewrite invoice line-item descriptions for a small business.',
        'Your only job is to improve wording. Follow these rules exactly:',
        '- Preserve the original meaning of each line item.',
        '- Do not invent facts, services, prices, quantities, tax rates, or dates.',
        '- Do not change billing logic or add work that was not described.',
        '- Return concise, clear, client-facing descriptions.',
        '- Fix grammar and make vague technical language professional.',
        '- Keep a calm, neutral, professional tone across all items.',
        '- Avoid fluff, marketing language, exaggeration, guarantees, and legal claims.',
        '- If an item is already clear, return it unchanged.',
        '- Output JSON only, matching the requested schema. No prose, no code fences.',
    ].join('\n')

export const buildRewriteUserPrompt = (request: AiRewriteRequest): string => {
    const tone = request.tone?.trim()
    const items = request.items.map((item) => ({ id: item.id, original: item.original }))

    return [
        tone ? `Preferred tone: ${tone}` : 'Preferred tone: professional and concise.',
        '',
        'Rewrite each line item. Return JSON with this exact shape:',
        '{ "items": [ { "id": string, "suggestion": string } ] }',
        'Include one entry per input id. Keep ids identical to the input.',
        '',
        'Line items to rewrite:',
        JSON.stringify({ items }, null, 2),
    ].join('\n')
}
