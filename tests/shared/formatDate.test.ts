import { describe, expect, it } from 'vitest'

import { addDaysIso, formatDate, isIsoDate, todayIso } from '../../src/shared/formatDate.js'

describe('date helpers', () => {
    it('validates calendar dates', () => {
        expect(isIsoDate('2026-07-09')).toBe(true)
        expect(isIsoDate('2026-02-30')).toBe(false)
        expect(isIsoDate('2026-13-01')).toBe(false)
        expect(isIsoDate('07/09/2026')).toBe(false)
    })

    it('formats an ISO date for display', () => {
        expect(formatDate('2026-07-09')).toBe('July 9, 2026')
    })

    it('returns the input unchanged when it is not a valid date', () => {
        expect(formatDate('not-a-date')).toBe('not-a-date')
    })

    it('adds days without timezone drift', () => {
        expect(addDaysIso(30, '2026-07-09')).toBe('2026-08-08')
        expect(addDaysIso(0, '2026-07-09')).toBe('2026-07-09')
    })

    it('produces a valid ISO string for today', () => {
        expect(isIsoDate(todayIso(new Date('2026-07-09T12:00:00Z')))).toBe(true)
    })
})
