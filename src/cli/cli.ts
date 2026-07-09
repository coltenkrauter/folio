#!/usr/bin/env node
import 'dotenv/config'

import { cac } from 'cac'

import pkg from '../../package.json'
import { isFolioError, toErrorMessage } from '../shared/errors.js'
import { logger } from '../shared/logger.js'
import { runConfig } from './commands/configCommand.js'
import { runCreate } from './commands/createCommand.js'
import { runDoctor } from './commands/doctorCommand.js'
import { runInit } from './commands/initCommand.js'
import { runPreview } from './commands/previewCommand.js'
import { runRender } from './commands/renderCommand.js'
import { PromptCancelled } from './prompts/prompt.js'

const cli = cac('folio')

cli.command('init', 'Set up Folio and save reusable business details').action(() => runInit())

cli.command('create', 'Create a new invoice (JSON + PDF)')
    .option('--ai', 'Offer AI help with line-item wording (asks before using it)')
    .action((options: { ai?: boolean }) => runCreate({ ai: options.ai }))

cli.command('render <file>', 'Validate an invoice JSON file and regenerate its PDF').action((file: string) =>
    runRender(file),
)

cli.command('preview <file>', 'Write a self-contained HTML preview of an invoice JSON file').action((file: string) =>
    runPreview(file),
)

cli.command('config', 'Show saved defaults (use --edit to change them)')
    .option('--edit', 'Update saved defaults')
    .action((options: { edit?: boolean }) => runConfig({ edit: options.edit }))

cli.command('doctor', 'Check your environment and what is optional').action(() => runDoctor())

cli.help()
cli.version(pkg.version)

const main = async (): Promise<void> => {
    cli.parse(process.argv, { run: false })

    if (!cli.matchedCommand) {
        // Bare `folio` with no command (cac already printed help for --help/--version).
        if (!cli.options.help && !cli.options.version) {
            cli.outputHelp()
        }
        return
    }

    await cli.runMatchedCommand()
}

main().catch((error: unknown) => {
    if (error instanceof PromptCancelled) {
        logger.info('Cancelled.')
        process.exit(0)
    }

    logger.blank()
    logger.error(toErrorMessage(error))
    if (isFolioError(error)) {
        error.details.forEach((detail) => logger.detail(`  ${detail}`))
    } else if (process.env.FOLIO_DEBUG) {
        console.error(error)
    }
    process.exit(1)
})
