import { createRequire } from 'node:module'

import pc from 'picocolors'

import { readAiEnv, DEFAULT_OPENROUTER_MODEL } from '../../ai/aiProvider.js'
import { configExists } from '../../config/loadConfig.js'
import { configPath } from '../../config/configPaths.js'
import { logger } from '../../shared/logger.js'
import { relativeToCwd } from '../../shared/paths.js'
import { resolveChromiumExecutable } from '../../pdf/pdfRenderer.js'

type CheckStatus = 'info' | 'ok' | 'warn'

const MIN_NODE = { major: 18, minor: 18 }

const icon = (status: CheckStatus): string => {
    if (status === 'ok') {
        return pc.green('✓')
    }
    if (status === 'warn') {
        return pc.yellow('!')
    }
    return pc.blue('•')
}

const report = (status: CheckStatus, label: string, detail: string): void => {
    logger.info(`${icon(status)} ${label.padEnd(16)} ${pc.dim(detail)}`)
}

const checkNode = (): void => {
    const [major = 0, minor = 0] = process.versions.node.split('.').map(Number)
    const ok = major > MIN_NODE.major || (major === MIN_NODE.major && minor >= MIN_NODE.minor)
    report(
        ok ? 'ok' : 'warn',
        'Node.js',
        ok
            ? `${process.versions.node}`
            : `${process.versions.node} — Folio needs >= ${MIN_NODE.major}.${MIN_NODE.minor}`,
    )
}

const checkDependencies = (): void => {
    try {
        const require = createRequire(import.meta.url)
        const zod = require('zod/package.json') as { version: string }
        const playwright = require('playwright-core/package.json') as { version: string }
        report('ok', 'Dependencies', `zod ${zod.version}, playwright-core ${playwright.version}`)
    } catch {
        report('warn', 'Dependencies', 'Core dependencies could not be resolved. Try reinstalling.')
    }
}

const checkConfig = async (): Promise<void> => {
    if (await configExists()) {
        report('ok', 'Config', relativeToCwd(configPath()))
    } else {
        report('info', 'Config', 'Not set up yet — run `folio init` (optional).')
    }
}

const checkBrowser = (): void => {
    const executable = resolveChromiumExecutable()
    if (executable) {
        report('ok', 'PDF browser', executable)
    } else {
        report(
            'warn',
            'PDF browser',
            'Not found — run `pnpm dlx playwright install chromium` or set FOLIO_CHROMIUM_PATH.',
        )
    }
}

const checkOpenRouter = (): void => {
    const env = readAiEnv()
    if (env.apiKey) {
        report('ok', 'AI (OpenRouter)', `Enabled — model ${env.model ?? DEFAULT_OPENROUTER_MODEL}`)
    } else {
        report('info', 'AI (OpenRouter)', 'Optional — set OPENROUTER_API_KEY to enable `folio create --ai`.')
    }
}

/** `folio doctor` — report what works and what is optional. Never fails. */
export const runDoctor = async (): Promise<void> => {
    logger.info(pc.bold('Folio doctor'))
    logger.blank()

    checkNode()
    checkDependencies()
    await checkConfig()
    checkBrowser()
    checkOpenRouter()

    logger.blank()
    logger.detail('Everything marked • is optional. Core invoice generation needs only Node and a browser.')
}
