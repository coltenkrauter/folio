import { defineConfig } from 'tsup'

export default defineConfig({
    entry: {
        cli: 'src/cli/cli.ts',
        index: 'src/index.ts',
    },
    format: ['esm'],
    target: 'node18',
    platform: 'node',
    dts: {
        entry: 'src/index.ts',
    },
    clean: true,
    sourcemap: true,
    splitting: false,
    shims: false,
})
