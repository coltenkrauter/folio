import { describe, expect, it, vi } from 'vitest'

// Simulate @clack/prompts. `text()` can resolve to `undefined` on an empty
// submit (no defaultValue), which previously crashed askText on `.trim()`.
const { textMock } = vi.hoisted(() => ({ textMock: vi.fn() }))

vi.mock('@clack/prompts', () => ({
    text: textMock,
    confirm: vi.fn(),
    select: vi.fn(),
    isCancel: (value: unknown) => typeof value === 'symbol',
}))

const { askText } = await import('../../src/cli/prompts/prompt.js')

describe('askText', () => {
    it('coerces an undefined result (empty submit) to an empty string instead of crashing', async () => {
        textMock.mockResolvedValueOnce(undefined)
        await expect(askText({ message: 'Phone (optional)' })).resolves.toBe('')
    })

    it('trims a normal string result', async () => {
        textMock.mockResolvedValueOnce('  Colten Krauter  ')
        await expect(askText({ message: 'Business name' })).resolves.toBe('Colten Krauter')
    })

    it('passes a default value so clack never returns undefined on empty submit', async () => {
        textMock.mockResolvedValueOnce('')
        await askText({ message: 'City (optional)' })
        expect(textMock).toHaveBeenCalledWith(expect.objectContaining({ defaultValue: '' }))
    })
})
