import { resolve } from 'node:path'

import { CONFIG_FILE_NAME, FOLIO_DIR_NAME } from '../shared/paths.js'

/** Absolute path to the local `.folio` directory for a given project root. */
export const folioDir = (base: string = process.cwd()): string => resolve(base, FOLIO_DIR_NAME)

/** Absolute path to `.folio/config.json` for a given project root. */
export const configPath = (base: string = process.cwd()): string => resolve(folioDir(base), CONFIG_FILE_NAME)
