import pc from 'picocolors'

/**
 * A minimal, calm logger for non-interactive output (render, doctor, errors).
 * Interactive flows use @clack/prompts directly; this keeps plain commands and
 * error reporting consistent without pulling the prompt library everywhere.
 */

const write = (stream: NodeJS.WriteStream, line: string): void => {
    stream.write(`${line}\n`)
}

export const logger = {
    /** Neutral informational line. */
    info(message: string): void {
        write(process.stdout, message)
    },
    /** Positive confirmation, e.g. a file that was written. */
    success(message: string): void {
        write(process.stdout, `${pc.green('✓')} ${message}`)
    },
    /** Non-fatal caution. */
    warn(message: string): void {
        write(process.stderr, `${pc.yellow('!')} ${message}`)
    },
    /** Failure. */
    error(message: string): void {
        write(process.stderr, `${pc.red('✗')} ${message}`)
    },
    /** Secondary, de-emphasized detail. */
    detail(message: string): void {
        write(process.stdout, pc.dim(message))
    },
    /** A blank line for breathing room. */
    blank(): void {
        write(process.stdout, '')
    },
}
