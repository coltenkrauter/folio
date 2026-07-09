import { FolioError, formatZodIssues } from '../shared/errors.js'
import { writeJsonFile } from '../shared/fileSystem.js'
import { configPath } from './configPaths.js'
import { folioConfigSchema } from './configSchema.js'
import type { FolioConfig } from './configTypes.js'

/**
 * Validates and writes the Folio config to `.folio/config.json`, creating the
 * directory if needed. Returns the absolute path written. Validation here is a
 * safety net so a malformed in-memory config never reaches disk.
 */
export const saveConfig = async (config: FolioConfig, base: string = process.cwd()): Promise<string> => {
    const parsed = folioConfigSchema.safeParse(config)
    if (!parsed.success) {
        throw new FolioError('CONFIG_INVALID', 'Cannot save an invalid config.', {
            details: formatZodIssues(parsed.error),
        })
    }

    const path = configPath(base)
    await writeJsonFile(path, parsed.data)
    return path
}
