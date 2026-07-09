import type { ZodError } from 'zod'

/**
 * Folio uses a small set of typed errors so the CLI can present clean, human
 * messages instead of raw stack traces. Anything the user can reasonably act on
 * should be a `FolioError`; unexpected failures bubble up as normal errors.
 */

export type FolioErrorCode =
    | 'AI_DISABLED'
    | 'AI_REQUEST_FAILED'
    | 'AI_RESPONSE_INVALID'
    | 'BROWSER_NOT_FOUND'
    | 'CONFIG_INVALID'
    | 'CONFIG_NOT_FOUND'
    | 'FILE_EXISTS'
    | 'INVOICE_INVALID'
    | 'IO_FAILED'
    | 'PDF_RENDER_FAILED'

export interface FolioErrorOptions {
    cause?: unknown
    /** Optional short hints shown to the user under the message. */
    details?: string[]
}

export class FolioError extends Error {
    readonly code: FolioErrorCode
    readonly details: string[]

    constructor(code: FolioErrorCode, message: string, options: FolioErrorOptions = {}) {
        super(message, { cause: options.cause })
        this.name = 'FolioError'
        this.code = code
        this.details = options.details ?? []
    }
}

export const isFolioError = (value: unknown): value is FolioError => value instanceof FolioError

/** Flattens a ZodError into human-readable `path: message` lines. */
export const formatZodIssues = (error: ZodError): string[] =>
    error.issues.map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
    })

/** Normalizes any thrown value into a readable message without leaking secrets. */
export const toErrorMessage = (error: unknown): string => {
    if (isFolioError(error) || error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'An unexpected error occurred.'
}
