import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { intro, log } from '@clack/prompts'
import pc from 'picocolors'

import { loadConfigOrNull } from '../../config/loadConfig.js'
import { resolvePath } from '../../shared/paths.js'
import { askSelect, askText, requiredValidator, type SelectOption } from '../prompts/prompt.js'
import { runConfig } from './configCommand.js'
import { runCreate } from './createCommand.js'
import { runDoctor } from './doctorCommand.js'
import { runInit } from './initCommand.js'
import { runPreview } from './previewCommand.js'
import { runRender } from './renderCommand.js'

/**
 * The interactive launcher shown when Folio is run with no subcommand. It is a
 * calm hub: one question, a handful of clear options, then it hands off to the
 * same command handlers the explicit subcommands use. Power users can still run
 * `folio create`, `folio render <file>`, etc. directly.
 */

export type MenuAction = 'create' | 'create-ai' | 'render' | 'preview' | 'init' | 'config' | 'doctor' | 'quit'

export const MENU_OPTIONS: SelectOption<MenuAction>[] = [
    { label: 'Create a new invoice', value: 'create', hint: 'writes JSON + PDF' },
    { label: 'Create a new invoice with AI wording help', value: 'create-ai', hint: 'asks first' },
    { label: 'Render an invoice to PDF', value: 'render', hint: 'from a saved .json' },
    { label: 'Preview an invoice as HTML', value: 'preview', hint: 'no browser needed' },
    { label: 'Set up or edit your business details', value: 'init' },
    { label: 'Show saved settings', value: 'config' },
    { label: 'Check my setup', value: 'doctor' },
    { label: 'Quit', value: 'quit' },
]

/**
 * The handlers the menu routes to. Injected so the routing in
 * {@link dispatchMenuAction} stays pure and testable without a TTY.
 */
export interface MenuHandlers {
    create: (options: { ai?: boolean }) => Promise<void>
    render: (file: string) => Promise<void>
    preview: (file: string) => Promise<void>
    init: () => Promise<void>
    config: (options: { edit?: boolean }) => Promise<void>
    doctor: () => Promise<void>
    pickInvoiceFile: (message: string) => Promise<string>
    onQuit: () => void
}

const INVOICE_DIRS = ['invoices', 'examples']

/** Lists invoice JSON files Folio already knows about, for the render/preview pickers. */
const findInvoiceJsonFiles = (): string[] => {
    const found: string[] = []
    for (const dir of INVOICE_DIRS) {
        const abs = resolvePath(dir)
        if (!existsSync(abs)) {
            continue
        }
        for (const entry of readdirSync(abs)) {
            if (entry.toLowerCase().endsWith('.json')) {
                found.push(join(dir, entry))
            }
        }
    }
    return found.sort()
}

const MANUAL_PATH = '__enter_a_path__'

/** Offers any known invoice JSON files, always with an escape hatch to type a path. */
export const pickInvoiceFile = async (message: string): Promise<string> => {
    const files = findInvoiceJsonFiles()
    const askForPath = (): Promise<string> =>
        askText({
            message: 'Path to an invoice .json',
            placeholder: 'invoices/INV-2026-001-my-client.json',
            validate: requiredValidator('A file path'),
        })

    if (files.length === 0) {
        return askForPath()
    }

    const choice = await askSelect<string>(message, [
        ...files.map((file) => ({ label: file, value: file })),
        { label: 'Enter a different path…', value: MANUAL_PATH },
    ])
    return choice === MANUAL_PATH ? askForPath() : choice
}

export const defaultMenuHandlers: MenuHandlers = {
    create: runCreate,
    render: runRender,
    preview: runPreview,
    init: runInit,
    config: runConfig,
    doctor: runDoctor,
    pickInvoiceFile,
    onQuit: () => log.info('See you next time.'),
}

/** Routes a chosen menu action to its handler. Pure aside from the handlers it calls. */
export const dispatchMenuAction = async (action: MenuAction, handlers: MenuHandlers): Promise<void> => {
    switch (action) {
        case 'create':
            return handlers.create({})
        case 'create-ai':
            return handlers.create({ ai: true })
        case 'render':
            return handlers.render(await handlers.pickInvoiceFile('Which invoice should I render?'))
        case 'preview':
            return handlers.preview(await handlers.pickInvoiceFile('Which invoice should I preview?'))
        case 'init':
            return handlers.init()
        case 'config':
            return handlers.config({})
        case 'doctor':
            return handlers.doctor()
        case 'quit':
            return handlers.onQuit()
    }
}

/** `folio` with no subcommand — greet, ask one question, and hand off. */
export const runMenu = async (handlers: MenuHandlers = defaultMenuHandlers): Promise<void> => {
    intro(`${pc.bold('Folio')}${pc.dim(' · a calm CLI invoice generator')}`)

    const { config } = await loadConfigOrNull()
    if (config?.business.name) {
        log.info(`Billing as ${pc.bold(config.business.name)}.`)
    } else {
        log.info('No business profile saved yet — pick “Set up or edit your business details” to save one for reuse.')
    }

    const action = await askSelect<MenuAction>('What would you like to do?', MENU_OPTIONS)
    await dispatchMenuAction(action, handlers)
}
