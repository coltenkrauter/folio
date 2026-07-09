import { FolioError } from '../shared/errors.js'
import type { AiRewriteRequest, AiRewriteResponse } from './aiTypes.js'
import { createOpenRouterProvider } from './openRouterProvider.js'

/**
 * The contract every AI backend implements. Keeping this narrow means the rest
 * of Folio never depends on OpenRouter directly and providers stay swappable.
 */
export interface AiProvider {
    readonly model: string
    readonly name: string
    rewriteLineItems(request: AiRewriteRequest): Promise<AiRewriteResponse>
}

export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4.1-mini'

export interface AiEnv {
    apiKey: string | undefined
    model: string | undefined
}

/** Reads AI-related environment variables without persisting or logging them. */
export const readAiEnv = (env: NodeJS.ProcessEnv = process.env): AiEnv => ({
    apiKey: env.OPENROUTER_API_KEY?.trim() || undefined,
    model: env.OPENROUTER_MODEL?.trim() || undefined,
})

/** True when an OpenRouter API key is present in the environment. */
export const isAiConfigured = (env: NodeJS.ProcessEnv = process.env): boolean => Boolean(readAiEnv(env).apiKey)

export interface ResolveAiProviderOptions {
    env?: NodeJS.ProcessEnv
    /** Preferred model (e.g. from config); falls back to env then default. */
    model?: string
}

/**
 * Builds the active AI provider from the environment. Throws
 * `FolioError('AI_DISABLED')` when no API key is set, so callers can fall back
 * to manual wording gracefully.
 */
export const resolveAiProvider = (options: ResolveAiProviderOptions = {}): AiProvider => {
    const env = readAiEnv(options.env)
    if (!env.apiKey) {
        throw new FolioError('AI_DISABLED', 'OpenRouter API key not found.', {
            details: ['Set OPENROUTER_API_KEY in your environment to enable AI assistance.'],
        })
    }
    const model = options.model?.trim() || env.model || DEFAULT_OPENROUTER_MODEL
    return createOpenRouterProvider({ apiKey: env.apiKey, model })
}
