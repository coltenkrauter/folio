import { FolioError } from '../shared/errors.js'
import type { AiProvider } from './aiProvider.js'
import { aiModelResponseSchema, type AiRewriteRequest, type AiRewriteResponse } from './aiTypes.js'
import { buildRewriteSystemPrompt, buildRewriteUserPrompt } from './prompts.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 30_000

export interface OpenRouterOptions {
    apiKey: string
    /** Override for tests or self-hosted gateways. */
    baseUrl?: string
    /** Injectable fetch for testing. Defaults to the global fetch. */
    fetchImpl?: typeof fetch
    model: string
}

interface ChatCompletion {
    choices?: Array<{ message?: { content?: string | null } }>
}

/** Strips optional Markdown code fences the model may wrap JSON in. */
const stripCodeFences = (text: string): string => {
    const trimmed = text.trim()
    if (!trimmed.startsWith('```')) {
        return trimmed
    }
    return trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()
}

const parseModelContent = (content: string, request: AiRewriteRequest): AiRewriteResponse => {
    let json: unknown
    try {
        json = JSON.parse(stripCodeFences(content))
    } catch (cause) {
        throw new FolioError('AI_RESPONSE_INVALID', 'The AI response was not valid JSON.', { cause })
    }

    const parsed = aiModelResponseSchema.safeParse(json)
    if (!parsed.success) {
        throw new FolioError('AI_RESPONSE_INVALID', 'The AI response did not match the expected shape.')
    }

    const suggestionsById = new Map(parsed.data.items.map((item) => [item.id, item.suggestion]))
    const suggestions = request.items.map((item) => ({
        id: item.id,
        original: item.original,
        suggestion: suggestionsById.get(item.id)?.trim() || item.original,
    }))
    return { suggestions }
}

/**
 * OpenRouter-backed {@link AiProvider}. All OpenRouter specifics live here.
 * The API key is only ever sent in the Authorization header — it is never
 * logged, echoed, or included in error messages.
 */
export const createOpenRouterProvider = (options: OpenRouterOptions): AiProvider => {
    const fetchImpl = options.fetchImpl ?? fetch
    const url = options.baseUrl ?? OPENROUTER_URL

    return {
        model: options.model,
        name: 'openrouter',
        async rewriteLineItems(request: AiRewriteRequest): Promise<AiRewriteResponse> {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

            let response: Response
            try {
                response = await fetchImpl(url, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${options.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/coltenkrauter/folio',
                        'X-Title': 'Folio',
                    },
                    body: JSON.stringify({
                        model: options.model,
                        temperature: 0.3,
                        response_format: { type: 'json_object' },
                        messages: [
                            { role: 'system', content: buildRewriteSystemPrompt() },
                            { role: 'user', content: buildRewriteUserPrompt(request) },
                        ],
                    }),
                })
            } catch (cause) {
                const aborted = cause instanceof Error && cause.name === 'AbortError'
                throw new FolioError(
                    'AI_REQUEST_FAILED',
                    aborted ? 'The AI request timed out.' : 'Could not reach OpenRouter.',
                    { cause },
                )
            } finally {
                clearTimeout(timeout)
            }

            if (!response.ok) {
                throw new FolioError(
                    'AI_REQUEST_FAILED',
                    `OpenRouter returned ${response.status} ${response.statusText}.`,
                )
            }

            const payload = (await response.json()) as ChatCompletion
            const content = payload.choices?.[0]?.message?.content
            if (!content) {
                throw new FolioError('AI_RESPONSE_INVALID', 'The AI response was empty.')
            }

            return parseModelContent(content, request)
        },
    }
}
