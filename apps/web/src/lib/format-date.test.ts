import { describe, expect, it } from 'vitest'
import { formatDay, formatYearMonth } from './format-date'

describe('formatYearMonth', () => {
  it('formats a year-month string', () => {
    expect(formatYearMonth('2024-03')).toBe('Mar 2024')
  })

  it('returns the input when the month is invalid', () => {
    expect(formatYearMonth('2024-13')).toBe('2024-13')
  })
})

describe('formatDay', () => {
  it('formats a timestamp as a short date', () => {
    expect(formatDay(new Date(2026, 10, 23, 12).getTime())).toBe('Nov 23, 2026')
  })
})
