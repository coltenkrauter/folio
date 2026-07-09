import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright-core'

import { FolioError } from '../shared/errors.js'

/**
 * Abstracts "HTML string in, PDF bytes out" so the rest of Folio never depends
 * on a specific browser. The default implementation drives headless Chromium
 * via playwright-core; page size and margins come from the document's CSS
 * `@page` rule (`preferCSSPageSize`), keeping the theme the single source.
 */
export interface PdfRenderer {
    renderPdf(html: string): Promise<Uint8Array>
}

const LINUX_CANDIDATES = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
]

const MAC_CANDIDATES = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
]

const WINDOWS_CANDIDATES = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

const platformCandidates = (): string[] => {
    if (process.platform === 'darwin') {
        return MAC_CANDIDATES
    }
    if (process.platform === 'win32') {
        return WINDOWS_CANDIDATES
    }
    return LINUX_CANDIDATES
}

/**
 * Executables under `PLAYWRIGHT_BROWSERS_PATH`. Playwright stores browsers as
 * `chromium-<revision>/chrome-<platform>/...`, so we scan for those. We also
 * accept a bare `chromium` entry, which some environments provide as a
 * version-independent symlink.
 */
const playwrightBrowsersCandidates = (): string[] => {
    const root = process.env.PLAYWRIGHT_BROWSERS_PATH
    if (!root) {
        return []
    }

    const candidates = [join(root, 'chromium')]
    try {
        for (const entry of readdirSync(root)) {
            if (entry.startsWith('chromium-')) {
                candidates.push(
                    join(root, entry, 'chrome-linux', 'chrome'),
                    join(root, entry, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
                    join(root, entry, 'chrome-win', 'chrome.exe'),
                )
            }
        }
    } catch {
        // Unreadable directory — fall through to the other resolution strategies.
    }
    return candidates
}

/**
 * Finds a usable Chromium/Chrome executable. Resolution order, first hit wins:
 * an explicit override, `FOLIO_CHROMIUM_PATH`, a Playwright-managed build, then
 * common per-OS install locations. Returns `null` when none is found.
 */
export const resolveChromiumExecutable = (override?: string): string | null => {
    const candidates = [override, process.env.FOLIO_CHROMIUM_PATH, ...playwrightBrowsersCandidates()].filter(
        (value): value is string => Boolean(value),
    )

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate
        }
    }

    try {
        const bundled = chromium.executablePath()
        if (bundled && existsSync(bundled)) {
            return bundled
        }
    } catch {
        // playwright-core has no bundled browser; fall through to system paths.
    }

    for (const candidate of platformCandidates()) {
        if (existsSync(candidate)) {
            return candidate
        }
    }

    return null
}

export interface PlaywrightRendererOptions {
    executablePath?: string
}

const BROWSER_HELP = [
    'Folio renders PDFs with headless Chromium and could not find a browser.',
    'Install one, then try again:',
    '  • pnpm dlx playwright install chromium',
    '  • or set FOLIO_CHROMIUM_PATH to an existing Chrome/Chromium binary',
    '  • or use `folio preview` to open an HTML preview without a browser',
]

export const createPlaywrightPdfRenderer = (options: PlaywrightRendererOptions = {}): PdfRenderer => ({
    async renderPdf(html: string): Promise<Uint8Array> {
        const executablePath = resolveChromiumExecutable(options.executablePath)
        if (!executablePath) {
            throw new FolioError('BROWSER_NOT_FOUND', 'No Chromium/Chrome executable was found.', {
                details: BROWSER_HELP,
            })
        }

        let browser
        try {
            browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--font-render-hinting=none'] })
        } catch (cause) {
            throw new FolioError('PDF_RENDER_FAILED', 'Could not launch the browser to render the PDF.', {
                cause,
                details: BROWSER_HELP,
            })
        }

        try {
            const page = await browser.newPage()
            await page.setContent(html, { waitUntil: 'networkidle' })
            await page.emulateMedia({ media: 'print' })
            const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true })
            return pdf
        } catch (cause) {
            throw new FolioError('PDF_RENDER_FAILED', 'The PDF could not be generated.', { cause })
        } finally {
            await browser.close()
        }
    },
})

/** True when a browser Folio can drive is available on this machine. */
export const isBrowserAvailable = (override?: string): boolean => resolveChromiumExecutable(override) !== null
