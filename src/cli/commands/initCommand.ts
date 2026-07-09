import { intro, log, outro } from '@clack/prompts'

import { loadConfigOrNull } from '../../config/loadConfig.js'
import { saveConfig } from '../../config/saveConfig.js'
import { relativeToCwd } from '../../shared/paths.js'
import { initConfigFlow } from '../flows/initConfigFlow.js'
import { askConfirm } from '../prompts/prompt.js'

/** `folio init` — set up the local config with reusable business details. */
export const runInit = async (): Promise<void> => {
    intro('Folio · setup')

    const { config: existing, invalid } = await loadConfigOrNull()
    if (invalid) {
        log.warn('Your existing config could not be read and will be replaced.')
    } else if (existing) {
        const update = await askConfirm('A config already exists. Update it?', true)
        if (!update) {
            outro('Kept your existing config.')
            return
        }
    }

    const config = await initConfigFlow(existing)
    const path = await saveConfig(config)

    log.success(`Saved config → ${relativeToCwd(path)}`)
    outro('Folio is ready. Run `folio create` to make an invoice.')
}
