import { confirm, isCancel, select, text } from '@clack/prompts'

import { isIsoDate } from '../../shared/formatDate.js'

/**
 * Thin wrappers around @clack/prompts that turn a user cancel (Ctrl+C / Esc)
 * into a typed {@link PromptCancelled} error. The CLI catches it once, at the
 * top level, and exits cleanly — so individual flows never have to thread
 * cancellation checks through every prompt.
 */

export class PromptCancelled extends Error {
    constructor() {
        super('Cancelled.')
        this.name = 'PromptCancelled'
    }
}

const unwrap = <T>(value: T | symbol): T => {
    if (isCancel(value)) {
        throw new PromptCancelled()
    }
    return value as T
}

export interface TextOptions {
    defaultValue?: string
    initialValue?: string
    message: string
    placeholder?: string
    validate?: (value: string) => string | undefined
}

export const askText = async (options: TextOptions): Promise<string> => {
    const value = await text({
        message: options.message,
        placeholder: options.placeholder,
        // clack resolves an empty submit to `defaultValue`; without this it
        // returns `undefined`, so optional fields would crash on `.trim()`.
        defaultValue: options.defaultValue ?? '',
        initialValue: options.initialValue,
        validate: options.validate ? (raw) => options.validate?.(raw ?? '') : undefined,
    })
    const raw = unwrap(value)
    return (typeof raw === 'string' ? raw : '').trim()
}

export interface SelectOption<T> {
    hint?: string
    label: string
    value: T
}

export const askSelect = async <T extends string>(
    message: string,
    options: SelectOption<T>[],
    initialValue?: T,
): Promise<T> => {
    const value = (await select({
        message,
        options: options as never,
        initialValue: initialValue as never,
    })) as T | symbol
    return unwrap(value)
}

export const askConfirm = async (message: string, initialValue = true): Promise<boolean> => {
    const value = await confirm({ message, initialValue })
    return unwrap(value)
}

// --- Reusable validators ---------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const requiredValidator =
    (label: string) =>
    (value: string): string | undefined =>
        value.trim().length > 0 ? undefined : `${label} is required.`

export const emailValidator = (value: string): string | undefined => {
    const trimmed = value.trim()
    return trimmed === '' || EMAIL_RE.test(trimmed) ? undefined : 'Enter a valid email address.'
}

export const urlValidator = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (trimmed === '') {
        return undefined
    }
    try {
        const url = new URL(trimmed)
        return url.protocol === 'http:' || url.protocol === 'https:'
            ? undefined
            : 'Enter a valid URL, including https://'
    } catch {
        return 'Enter a valid URL, including https://'
    }
}

export const isoDateValidator = (value: string): string | undefined =>
    isIsoDate(value.trim()) ? undefined : 'Enter a real calendar date in YYYY-MM-DD format.'

export const optionalIsoDateValidator = (value: string): string | undefined => {
    const trimmed = value.trim()
    return trimmed === '' || isIsoDate(trimmed) ? undefined : 'Enter a real calendar date in YYYY-MM-DD format.'
}

export interface NumberFieldOptions {
    allowZero?: boolean
    label: string
    max?: number
    min?: number
}

/** Parses a decimal from user input, returning NaN for anything non-numeric. */
export const parseNumber = (value: string): number => {
    const trimmed = value.trim().replace(/[$,]/g, '')
    if (trimmed === '') {
        return Number.NaN
    }
    return Number(trimmed)
}

export const numberValidator =
    (options: NumberFieldOptions) =>
    (value: string): string | undefined => {
        const parsed = parseNumber(value)
        if (!Number.isFinite(parsed)) {
            return `${options.label} must be a number.`
        }
        if (options.min !== undefined && parsed < options.min) {
            return `${options.label} must be at least ${options.min}.`
        }
        if (options.max !== undefined && parsed > options.max) {
            return `${options.label} must be no more than ${options.max}.`
        }
        if (options.allowZero === false && parsed === 0) {
            return `${options.label} must be greater than zero.`
        }
        return undefined
    }
