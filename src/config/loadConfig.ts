import { FolioError, formatZodIssues, isFolioError } from '../shared/errors.js'
import { pathExists, readJsonFile } from '../shared/fileSystem.js'
import { configPath } from './configPaths.js'
import { folioConfigSchema } from './configSchema.js'
import type { FolioConfig } from './configTypes.js'

/**
 * Loads and validates the local Folio config. Returns `null` when no config
 * exists yet (so commands can decide whether to prompt or nudge `folio init`).
 * Throws {@link FolioError} only when a config file exists but is invalid.
 */
export const loadConfig = async (base: string = process.cwd()): Promise<FolioConfig | null> => {
    const path = configPath(base)
    if (!(await pathExists(path))) {
        return null
    }

    const raw = await readJsonFile(path)
    const parsed = folioConfigSchema.safeParse(raw)
    if (!parsed.success) {
        throw new FolioError('CONFIG_INVALID', `Config at ${path} is invalid.`, {
            details: formatZodIssues(parsed.error),
        })
    }
    return parsed.data
}

export interface TolerantConfigResult {
    config: FolioConfig | null
    /** True when a config file exists but could not be loaded/validated. */
    invalid: boolean
}

/**
 * Like {@link loadConfig}, but never throws on a broken config: a corrupt or
 * schema-invalid file resolves to `{ config: null, invalid: true }`. This keeps
 * recovery commands (`init`, `config --edit`) and read-only commands runnable
 * even when the saved config is damaged.
 */
export const loadConfigOrNull = async (base: string = process.cwd()): Promise<TolerantConfigResult> => {
    try {
        return { config: await loadConfig(base), invalid: false }
    } catch (error) {
        if (isFolioError(error) && (error.code === 'CONFIG_INVALID' || error.code === 'IO_FAILED')) {
            return { config: null, invalid: true }
        }
        throw error
    }
}

/** True when a local config file exists (regardless of validity). */
export const configExists = async (base: string = process.cwd()): Promise<boolean> => pathExists(configPath(base))
