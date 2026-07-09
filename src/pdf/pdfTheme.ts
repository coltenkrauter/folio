/**
 * The single source of design tokens for the invoice PDF. Every color, size,
 * weight, and spacing value the template uses comes from here — the renderer
 * never hardcodes magic numbers. Adjusting the look means editing this file.
 *
 * The default palette is intentionally grayscale so invoices print cleanly in
 * black and white. An optional accent color (from config) tints only the title
 * rule and the total-due emphasis, and stays subtle by design.
 */

export type PageSize = 'A4' | 'Letter'

export interface PdfTheme {
    color: {
        accent: string
        hairline: string
        hairlineStrong: string
        ink: string
        muted: string
        paper: string
        strong: string
        subtle: string
        surface: string
    }
    font: {
        family: string
        weight: {
            bold: number
            medium: number
            regular: number
            semibold: number
        }
    }
    page: {
        margin: string
        size: PageSize
    }
    radius: {
        md: string
        sm: string
    }
    size: {
        body: string
        bodyLarge: string
        micro: string
        sectionLabel: string
        small: string
        tableHeader: string
        title: string
        totalDueLabel: string
        totalDueValue: string
        totalLabel: string
    }
    space: {
        lg: string
        md: string
        sm: string
        xl: string
        xs: string
        xxl: string
    }
    table: {
        cellPaddingX: string
        headerPaddingY: string
        rowPaddingY: string
    }
}

const SYSTEM_SANS =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Liberation Sans', Roboto, Helvetica, Arial, 'Helvetica Neue', sans-serif"

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export interface CreatePdfThemeOptions {
    accentColor?: string
    pageSize?: PageSize
}

/**
 * Builds a theme, applying an optional accent color and page size. An invalid
 * accent is ignored (falls back to the grayscale default) rather than throwing,
 * so a bad config value never blocks invoice generation.
 */
export const createPdfTheme = (options: CreatePdfThemeOptions = {}): PdfTheme => {
    const accent = options.accentColor && HEX_COLOR.test(options.accentColor) ? options.accentColor : '#12141c'

    return {
        color: {
            accent,
            hairline: '#e7e9ee',
            hairlineStrong: '#cfd3db',
            ink: '#1b1e27',
            muted: '#5f6672',
            paper: '#ffffff',
            strong: '#0b0d12',
            subtle: '#98a0ad',
            surface: '#f7f8fa',
        },
        font: {
            family: SYSTEM_SANS,
            weight: {
                bold: 700,
                medium: 500,
                regular: 400,
                semibold: 600,
            },
        },
        page: {
            margin: '16mm',
            size: options.pageSize ?? 'Letter',
        },
        radius: {
            md: '8px',
            sm: '4px',
        },
        size: {
            body: '10.5px',
            bodyLarge: '12px',
            micro: '8.5px',
            sectionLabel: '9px',
            small: '9.5px',
            tableHeader: '8.5px',
            title: '30px',
            totalDueLabel: '11px',
            totalDueValue: '19px',
            totalLabel: '10px',
        },
        space: {
            lg: '24px',
            md: '16px',
            sm: '8px',
            xl: '36px',
            xs: '4px',
            xxl: '56px',
        },
        table: {
            cellPaddingX: '12px',
            headerPaddingY: '8px',
            rowPaddingY: '11px',
        },
    }
}
