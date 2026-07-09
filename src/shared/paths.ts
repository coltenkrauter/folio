import { homedir } from 'node:os'
import { isAbsolute, relative, resolve } from 'node:path'

/** Directory name that holds Folio's local project config. */
export const FOLIO_DIR_NAME = '.folio'

/** File name for the persisted config inside {@link FOLIO_DIR_NAME}. */
export const CONFIG_FILE_NAME = 'config.json'

/** Default directory (relative to the project root) where invoices are written. */
export const DEFAULT_OUTPUT_DIR = 'invoices'

/** Expands a leading `~` to the user's home directory, then resolves to absolute. */
export const expandHome = (input: string): string => {
    if (input === '~') {
        return homedir()
    }
    if (input.startsWith('~/')) {
        return resolve(homedir(), input.slice(2))
    }
    return input
}

/** Resolves a possibly-relative path against a base directory (default: cwd). */
export const resolvePath = (input: string, base: string = process.cwd()): string => {
    const expanded = expandHome(input)
    return isAbsolute(expanded) ? expanded : resolve(base, expanded)
}

/** Formats an absolute path relative to the cwd for friendly display. */
export const relativeToCwd = (path: string): string => {
    const rel = relative(process.cwd(), path)
    return rel === '' ? '.' : rel.startsWith('..') ? path : rel
}
