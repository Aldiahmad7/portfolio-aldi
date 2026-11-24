import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'

const respond = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

afterEach(() => vi.restoreAllMocks())

describe('api client', () => {
  it('returns validated data', async () => {
    respond({ count: 7 })
    expect(await api.builds()).toEqual({ ok: true, data: { count: 7 } })
  })

  it('passes API errors through with their code and fields', async () => {
    respond({ error: { code: 'VALIDATION_ERROR', message: 'nope', fields: ['email'] } }, 400)
    const result = await api.sendContact({
      name: 'Rina',
      email: 'x',
      message: 'Halo, mau ngobrol.',
      turnstileToken: 't',
    })
    expect(result).toEqual({ ok: false, error: { code: 'VALIDATION_ERROR', fields: ['email'] } })
  })

  it('reports OFFLINE instead of throwing on network errors and unexpected bodies', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await api.builds()).toEqual({ ok: false, error: { code: 'OFFLINE' } })
    respond({ count: 'many' })
    expect(await api.builds()).toEqual({ ok: false, error: { code: 'OFFLINE' } })
    respond('<html>Bad gateway</html>', 502)
    expect(await api.comments(null)).toEqual({ ok: false, error: { code: 'OFFLINE' } })
  })

  it('sends the cursor for the next comments page', async () => {
    const fetch = respond({ items: [], nextCursor: null })
    await api.comments('1700_id-1')
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/comments?cursor=1700_id-1')
  })
})
