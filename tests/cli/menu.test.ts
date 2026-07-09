import { describe, expect, it, vi } from 'vitest'

import {
    dispatchMenuAction,
    MENU_OPTIONS,
    type MenuAction,
    type MenuHandlers,
} from '../../src/cli/commands/menuCommand.js'

const makeHandlers = (overrides: Partial<MenuHandlers> = {}): MenuHandlers => ({
    create: vi.fn(async () => undefined),
    render: vi.fn(async () => undefined),
    preview: vi.fn(async () => undefined),
    init: vi.fn(async () => undefined),
    config: vi.fn(async () => undefined),
    doctor: vi.fn(async () => undefined),
    pickInvoiceFile: vi.fn(async () => 'invoices/example.json'),
    onQuit: vi.fn(() => undefined),
    ...overrides,
})

describe('menu options', () => {
    it('lists every action exactly once, in a stable order', () => {
        const values = MENU_OPTIONS.map((option) => option.value)
        expect(new Set(values).size).toBe(values.length)
        expect(values).toEqual(['create', 'create-ai', 'render', 'preview', 'init', 'config', 'doctor', 'quit'])
    })
})

describe('dispatchMenuAction', () => {
    it('creates a plain invoice', async () => {
        const handlers = makeHandlers()
        await dispatchMenuAction('create', handlers)
        expect(handlers.create).toHaveBeenCalledWith({})
    })

    it('creates an AI-assisted invoice', async () => {
        const handlers = makeHandlers()
        await dispatchMenuAction('create-ai', handlers)
        expect(handlers.create).toHaveBeenCalledWith({ ai: true })
    })

    it('renders the picked file', async () => {
        const handlers = makeHandlers({ pickInvoiceFile: vi.fn(async () => 'invoices/a.json') })
        await dispatchMenuAction('render', handlers)
        expect(handlers.pickInvoiceFile).toHaveBeenCalledOnce()
        expect(handlers.render).toHaveBeenCalledWith('invoices/a.json')
    })

    it('previews the picked file', async () => {
        const handlers = makeHandlers({ pickInvoiceFile: vi.fn(async () => 'invoices/b.json') })
        await dispatchMenuAction('preview', handlers)
        expect(handlers.preview).toHaveBeenCalledWith('invoices/b.json')
    })

    it('routes init, config, doctor, and quit to their handlers', async () => {
        const handlers = makeHandlers()
        await dispatchMenuAction('init', handlers)
        await dispatchMenuAction('config', handlers)
        await dispatchMenuAction('doctor', handlers)
        await dispatchMenuAction('quit', handlers)
        expect(handlers.init).toHaveBeenCalledOnce()
        expect(handlers.config).toHaveBeenCalledWith({})
        expect(handlers.doctor).toHaveBeenCalledOnce()
        expect(handlers.onQuit).toHaveBeenCalledOnce()
    })

    it('has a handler branch for every menu option', async () => {
        for (const { value } of MENU_OPTIONS) {
            await expect(dispatchMenuAction(value as MenuAction, makeHandlers())).resolves.toBeUndefined()
        }
    })
})
