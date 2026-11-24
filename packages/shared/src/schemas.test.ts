import { describe, expect, it } from 'vitest'
import { LIMITS } from './limits'
import { commentInputSchema, commentsQuerySchema, contactInputSchema } from './schemas'

const comment = {
  section: 'guestbook',
  x: 50,
  y: 12.5,
  name: '  Rina  ',
  message: 'Halo\u0007 crew!',
  turnstileToken: 'token',
}

describe('commentInputSchema', () => {
  it('trims text and strips control characters', () => {
    const parsed = commentInputSchema.parse(comment)
    expect(parsed.name).toBe('Rina')
    expect(parsed.message).toBe('Halo crew!')
  })

  it('rejects an unknown section and a position outside 0–100', () => {
    expect(commentInputSchema.safeParse({ ...comment, section: 'footer' }).success).toBe(false)
    expect(commentInputSchema.safeParse({ ...comment, x: 101 }).success).toBe(false)
    expect(commentInputSchema.safeParse({ ...comment, y: -1 }).success).toBe(false)
  })

  it('enforces length limits after trimming', () => {
    expect(commentInputSchema.safeParse({ ...comment, name: '   ' }).success).toBe(false)
    const long = 'a'.repeat(LIMITS.commentMessage.max + 1)
    expect(commentInputSchema.safeParse({ ...comment, message: long }).success).toBe(false)
  })
})

describe('commentsQuerySchema', () => {
  it('coerces the limit from a query string and applies the default', () => {
    expect(commentsQuerySchema.parse({ limit: '5' }).limit).toBe(5)
    expect(commentsQuerySchema.parse({}).limit).toBe(LIMITS.page.default)
    expect(commentsQuerySchema.safeParse({ limit: '51' }).success).toBe(false)
  })
})

describe('contactInputSchema', () => {
  const contact = {
    name: 'Rina',
    email: 'rina@example.com',
    message: 'Halo, mau ngobrol soal proyek.',
    turnstileToken: 'token',
  }

  it('accepts a valid message', () => {
    expect(contactInputSchema.safeParse(contact).success).toBe(true)
  })

  it('rejects a bad email and a message that is too short', () => {
    expect(contactInputSchema.safeParse({ ...contact, email: 'rina' }).success).toBe(false)
    expect(contactInputSchema.safeParse({ ...contact, message: 'hai' }).success).toBe(false)
  })
})
