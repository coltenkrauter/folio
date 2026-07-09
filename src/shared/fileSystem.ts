import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { FolioError } from './errors.js'

/** True when a file or directory exists and is accessible. */
export const pathExists = async (path: string): Promise<boolean> => {
    try {
        await access(path, constants.F_OK)
        return true
    } catch {
        return false
    }
}

/** Creates a directory (and parents) if it does not already exist. */
export const ensureDir = async (path: string): Promise<void> => {
    try {
        await mkdir(path, { recursive: true })
    } catch (cause) {
        throw new FolioError('IO_FAILED', `Could not create directory: ${path}`, { cause })
    }
}

/** Reads a UTF-8 text file. */
export const readTextFile = async (path: string): Promise<string> => {
    try {
        return await readFile(path, 'utf8')
    } catch (cause) {
        throw new FolioError('IO_FAILED', `Could not read file: ${path}`, { cause })
    }
}

/** Writes a UTF-8 text file, creating parent directories as needed. */
export const writeTextFile = async (path: string, contents: string): Promise<void> => {
    try {
        await ensureDir(dirname(path))
        await writeFile(path, contents, 'utf8')
    } catch (cause) {
        if (cause instanceof FolioError) {
            throw cause
        }
        throw new FolioError('IO_FAILED', `Could not write file: ${path}`, { cause })
    }
}

/** Writes binary data (e.g. a rendered PDF), creating parent directories as needed. */
export const writeBinaryFile = async (path: string, data: Uint8Array): Promise<void> => {
    try {
        await ensureDir(dirname(path))
        await writeFile(path, data)
    } catch (cause) {
        if (cause instanceof FolioError) {
            throw cause
        }
        throw new FolioError('IO_FAILED', `Could not write file: ${path}`, { cause })
    }
}

/**
 * Recursively sorts object keys alphabetically so serialized output is
 * deterministic regardless of construction order. Arrays keep their order.
 */
export const sortKeysDeep = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep)
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.keys(value as Record<string, unknown>)
                .sort()
                .map((key) => [key, sortKeysDeep((value as Record<string, unknown>)[key])]),
        )
    }
    return value
}

/** Serializes a value to deterministic, pretty JSON (sorted keys, trailing newline). */
export const stableStringify = (value: unknown): string => `${JSON.stringify(sortKeysDeep(value), null, 2)}\n`

/** Reads and parses a JSON file, returning the raw parsed value (unvalidated). */
export const readJsonFile = async (path: string): Promise<unknown> => {
    const contents = await readTextFile(path)
    try {
        return JSON.parse(contents)
    } catch (cause) {
        throw new FolioError('IO_FAILED', `File is not valid JSON: ${path}`, { cause })
    }
}

/** Serializes a value to deterministic, pretty JSON and writes it. */
export const writeJsonFile = async (path: string, value: unknown): Promise<void> => {
    await writeTextFile(path, stableStringify(value))
}
