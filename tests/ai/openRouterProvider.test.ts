import { describe, expect, it, vi } from 'vitest'

import { createOpenRouterProvider } from '../../src/ai/openRouterProvider.js'
import type { AiRewriteRequest } from '../../src/ai/aiTypes.js'
import { isFolioError } from '../../src/shared/errors.js'

const request: AiRewriteRequest = {
    items: [
        { id: '0', original: 'setup pc and installed stuff' },
        { id: '1', original: 'kept original' },
    ],
}

const jsonResponse = (content: string) =>
    ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ choices: [{ message: { content } }] }),
    }) as Response

const expectFolioError = async (promise: Promise<unknown>, code: string): Promise<void> => {
    await expect(promise).rejects.toSatisfy((error) => isFolioError(error) && error.code === code)
}

describe('createOpenRouterProvider', () => {
    it('parses fenced JSON and re-attaches the original text', async () => {
        const fetchImpl = vi.fn(async () =>
            jsonResponse('```json\n{"items":[{"id":"0","suggestion":"Workstation setup and configuration"}]}\n```'),
        )
        const provider = createOpenRouterProvider({
            apiKey: 'sk-test',
            model: 'test/model',
            fetchImpl: fetchImpl as never,
        })
        const response = await provider.rewriteLineItems(request)

        expect(response.suggestions[0]?.suggestion).toBe('Workstation setup and configuration')
        // Missing id '1' falls back to the caller's original, never the model's word.
        expect(response.suggestions[1]?.suggestion).toBe('kept original')
    })

    it('sends the API key in the Authorization header only', async () => {
        let capturedInit: RequestInit | undefined
        const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
            capturedInit = init
            return jsonResponse('{"items":[]}')
        })
        const provider = createOpenRouterProvider({
            apiKey: 'sk-secret',
            model: 'test/model',
            fetchImpl: fetchImpl as never,
        })
        await provider.rewriteLineItems(request)

        const headers = capturedInit?.headers as Record<string, string>
        expect(headers.Authorization).toBe('Bearer sk-secret')
        expect(String(capturedInit?.body)).not.toContain('sk-secret')
    })

    it('throws AI_REQUEST_FAILED on a non-200 response', async () => {
        const fetchImpl = vi.fn(async () => ({ ok: false, status: 429, statusText: 'Too Many Requests' }) as Response)
        const provider = createOpenRouterProvider({
            apiKey: 'sk-test',
            model: 'test/model',
            fetchImpl: fetchImpl as never,
        })
        await expectFolioError(provider.rewriteLineItems(request), 'AI_REQUEST_FAILED')
    })

    it('throws AI_RESPONSE_INVALID when the content is not JSON', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse('sorry, I cannot do that'))
        const provider = createOpenRouterProvider({
            apiKey: 'sk-test',
            model: 'test/model',
            fetchImpl: fetchImpl as never,
        })
        await expectFolioError(provider.rewriteLineItems(request), 'AI_RESPONSE_INVALID')
    })

    it('throws AI_RESPONSE_INVALID when the content is empty', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse(''))
        const provider = createOpenRouterProvider({
            apiKey: 'sk-test',
            model: 'test/model',
            fetchImpl: fetchImpl as never,
        })
        await expectFolioError(provider.rewriteLineItems(request), 'AI_RESPONSE_INVALID')
    })
})
