import type { YearMonth } from '../content/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2024-03' → 'Mar 2024'. A fixed table instead of Intl so prerender and browser output match. */
export function formatYearMonth(value: YearMonth): string {
  const [year, month] = value.split('-')
  const monthName = MONTHS[Number(month) - 1]
  return monthName ? `${monthName} ${year}` : value
}

/** Unix ms → 'Nov 23, 2026' in the visitor's time zone. Only used client-side (fetched comments). */
export function formatDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}
