# Contributing to Folio

Thanks for your interest in Folio. It intentionally does a small job well, so the
best contributions keep it calm, local-first, and easy to read.

## Getting started

Folio needs **Node.js 18.18+** and **pnpm 10**.

```bash
pnpm install
pnpm dev              # run the CLI from source (tsx)
```

To render PDFs locally, install a browser Folio can drive (or point
`FOLIO_CHROMIUM_PATH` at an existing Chrome/Chromium):

```bash
pnpm dlx playwright install chromium
```

Run `folio doctor` at any time to see what's set up and what's optional.

## The check gate

Before opening a pull request, run the same gate CI runs — all must pass:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm format:check     # prettier --check (run `pnpm format` to fix)
pnpm test             # vitest
pnpm build            # tsup -> dist/
```

If you touched the PDF template or theme, render the bundled example and eyeball
the result:

```bash
folio render examples/INV-2026-001-kcw-builds.json
```

## Code style

- ESM only, modern TypeScript.
- Single quotes, no semicolons, 4-space indentation (Prettier enforces this).
- Zod schemas at every runtime boundary; typed `FolioError` for clean messages.
- Keep business logic pure and tested; the CLI stays a thin layer on top.
- No new network calls. AI wording is the only feature that reaches the internet,
  it is strictly opt-in, and it sends only line-item descriptions.

## Commits & pull requests

- Keep commits focused and messages in the imperative mood.
- Never commit secrets, `node_modules/`, `dist/`, `.env`, or generated
  invoices/PDFs — `.gitignore` already covers these.
- Fill out the pull request template and confirm the check gate is green.
