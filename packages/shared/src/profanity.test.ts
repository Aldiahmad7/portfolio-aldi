import { describe, expect, it } from 'vitest'
import { containsProfanity, normalizeForFilter } from './profanity'

describe('profanity filter', () => {
  it('normalizes case, leetspeak and punctuation', () => {
    expect(normalizeForFilter('Sh1t!')).toBe('shit')
    expect(normalizeForFilter('B4ngs@t')).toBe('bangsat')
  })

  it('flags blocked words in Indonesian and English, including inflections', () => {
    expect(containsProfanity('dasar goblok')).toBe(true)
    expect(containsProfanity('what the fucking hell')).toBe(true)
    expect(containsProfanity('nice', 'F.U.C.K this')).toBe(true)
  })

  it('leaves clean text alone, even when two words join into a blocked word', () => {
    expect(containsProfanity('Keren banget portofolionya!')).toBe(false)
    expect(containsProfanity('first class hit')).toBe(false)
  })
})
