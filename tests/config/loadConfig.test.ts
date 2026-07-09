import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import { loadConfig, loadConfigOrNull } from '../../src/config/loadConfig.js'
import { emptyBusinessProfile } from '../../src/config/configSchema.js'

const roots: string[] = []

const makeBase = (configContents?: string): string => {
    const base = mkdtempSync(join(tmpdir(), 'folio-config-'))
    roots.push(base)
    if (configContents !== undefined) {
        mkdirSync(join(base, '.folio'), { recursive: true })
        writeFileSync(join(base, '.folio', 'config.json'), configContents)
    }
    return base
}

const validConfig = JSON.stringify({ business: { ...emptyBusinessProfile(), name: 'Colten Krauter' } })

describe('loadConfig', () => {
    it('returns null when no config exists', async () => {
        expect(await loadConfig(makeBase())).toBeNull()
    })

    it('throws on an invalid config', async () => {
        await expect(loadConfig(makeBase('{"business":{"name":""}}'))).rejects.toThrow()
    })
})

describe('loadConfigOrNull', () => {
    it('loads a valid config', async () => {
        const result = await loadConfigOrNull(makeBase(validConfig))
        expect(result.invalid).toBe(false)
        expect(result.config?.business.name).toBe('Colten Krauter')
    })

    it('tolerates a schema-invalid config instead of throwing', async () => {
        const result = await loadConfigOrNull(makeBase('{"business":{"name":""}}'))
        expect(result).toEqual({ config: null, invalid: true })
    })

    it('tolerates corrupt JSON instead of throwing', async () => {
        const result = await loadConfigOrNull(makeBase('{ not json'))
        expect(result).toEqual({ config: null, invalid: true })
    })

    it('reports a missing config as valid-but-absent', async () => {
        expect(await loadConfigOrNull(makeBase())).toEqual({ config: null, invalid: false })
    })
})

afterAll(() => {
    for (const root of roots) {
        rmSync(root, { recursive: true, force: true })
    }
})
