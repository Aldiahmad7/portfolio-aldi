import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, jsonResponse, testEnv } from './test-utils'

const post = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
const comment = {
  section: 'guestbook',
  x: 10,
  y: 20,
  name: 'Rina',
  message: 'Halo!',
  turnstileToken: 't',
}
const contact = {
  name: 'Rina',
  email: 'rina@example.com',
  message: 'Halo, mau ngobrol.',
  turnstileToken: 't',
}

afterEach(() => vi.restoreAllMocks())

describe('API routes', () => {
  it('counts builds', async () => {
    const { app } = createTestApp()
    const env = testEnv()
    expect(await (await app.request('/api/builds', {}, env)).json()).toEqual({ count: 0 })
    const response = await app.request('/api/builds', { method: 'POST' }, env)
    expect(await response.json()).toEqual({ count: 1 })
  })

  it('creates a comment and lists it with a cache header', async () => {
    const { app } = createTestApp()
    const env = testEnv()
    const created = await app.request('/api/comments', post(comment), env)
    expect(created.status).toBe(201)
    expect(await created.json()).toMatchObject({ item: { id: 'id-1', name: 'Rina' } })

    const listed = await app.request('/api/comments?section=guestbook&limit=5', {}, env)
    expect(listed.headers.get('Cache-Control')).toBe('public, max-age=30')
    expect(await listed.json()).toMatchObject({ items: [{ id: 'id-1' }], nextCursor: null })
  })

  it('answers every failure in the shared error format', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { app } = createTestApp({ fetch: async () => jsonResponse({ success: false }) })
    const env = testEnv()

    const invalid = await app.request('/api/comments', post({ ...comment, x: 500 }), env)
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR', fields: ['x'] },
    })

    const bot = await app.request('/api/comments', post(comment), env)
    expect(bot.status).toBe(403)
    expect(await bot.json()).toMatchObject({ error: { code: 'TURNSTILE_FAILED' } })

    const missing = await app.request('/api/nope', {}, env)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ error: { code: 'NOT_FOUND' } })

    const broken = await app.request('/api/comments', { ...post(comment), body: '{' }, env)
    expect(await broken.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })

  it('rate limits before validating', async () => {
    const { app } = createTestApp()
    const env = testEnv({ RATE_LIMIT_CONTACT: { limit: async () => ({ success: false }) } })
    const response = await app.request('/api/contact', post({}), env)
    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } })
  })

  it('rejects a body over 8 KB', async () => {
    const { app } = createTestApp()
    const huge = { ...comment, message: 'a'.repeat(9000) }
    const response = await app.request('/api/comments', post(huge), testEnv())
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })

  it('sends a contact message', async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true }))
    const { app } = createTestApp({ fetch })
    const response = await app.request('/api/contact', post(contact), testEnv())
    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ ok: true })
    // Turnstile first, then Resend.
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('allows CORS only for listed origins', async () => {
    const { app } = createTestApp()
    const env = testEnv()
    const allowed = await app.request(
      '/api/builds',
      { headers: { Origin: 'http://localhost:5173' } },
      env,
    )
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
    const other = await app.request(
      '/api/builds',
      { headers: { Origin: 'https://evil.test' } },
      env,
    )
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
