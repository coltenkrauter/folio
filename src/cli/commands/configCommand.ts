import { intro, log, outro } from '@clack/prompts'
import pc from 'picocolors'

import { configPath } from '../../config/configPaths.js'
import { loadConfig, loadConfigOrNull } from '../../config/loadConfig.js'
import { paymentHasContent } from '../../config/rememberInvoice.js'
import { saveConfig } from '../../config/saveConfig.js'
import { logger } from '../../shared/logger.js'
import { relativeToCwd } from '../../shared/paths.js'
import { initConfigFlow } from '../flows/initConfigFlow.js'

export interface ConfigCommandOptions {
    edit?: boolean
}

const showConfig = async (): Promise<void> => {
    const config = await loadConfig()
    if (!config) {
        logger.warn('No config found. Run `folio init` to create one.')
        return
    }

    const rows: [string, string][] = [
        ['Business', config.business.name],
        ['Email', config.business.email || '—'],
        ['Currency', config.defaultCurrency],
        ['Payment terms', config.defaultPaymentTerms],
        ['Output directory', config.outputDir],
        ['OpenRouter model', config.openRouterModel],
        ['Accent color', config.accentColor ?? 'default (grayscale)'],
        ['Last invoice', config.lastInvoiceNumber ?? '—'],
        ['Saved payment', config.payment && paymentHasContent(config.payment) ? 'yes' : 'none'],
        ['Recent clients', String(config.recentClients?.length ?? 0)],
    ]
    const width = Math.max(...rows.map(([label]) => label.length))

    logger.info(pc.bold('Folio config'))
    logger.detail(relativeToCwd(configPath()))
    logger.blank()
    for (const [label, value] of rows) {
        logger.info(`${pc.dim(label.padEnd(width))}  ${value}`)
    }
    logger.blank()
    logger.detail('Update it with `folio config --edit`.')
}

/** `folio config` — show saved defaults, or update them with `--edit`. */
export const runConfig = async (options: ConfigCommandOptions = {}): Promise<void> => {
    if (!options.edit) {
        await showConfig()
        return
    }

    const { config: existing, invalid } = await loadConfigOrNull()
    intro('Folio · update config')
    if (invalid) {
        log.warn('Your existing config could not be read and will be replaced.')
    }
    const updated = await initConfigFlow(existing)
    const path = await saveConfig(updated)
    log.success(`Updated config → ${relativeToCwd(path)}`)
    outro('Saved.')
}
