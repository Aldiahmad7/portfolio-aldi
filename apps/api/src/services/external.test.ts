import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../test-utils'
import { sendContact } from './contact'
import { verifyTurnstile } from './turnstile'

const message = { name: 'Rina', email: 'rina@example.com', message: 'Halo, mau ngobrol.' }
const email = { apiKey: 'key', to: 'owner@example.com', from: 'portfolio@example.com' }

describe('verifyTurnstile', () => {
  it('sends secret, token and IP to siteverify', async () => {
    const fetch = vi.fn(async () => jsonResponse({ success: true }))
    await verifyTurnstile({ fetch, secret: 'secret' }, 'token', '203.0.113.1')
    const body = fetch.mock.calls[0]?.at(1) as RequestInit | undefined
    const form = body?.body as FormData
    expect(Object.fromEntries(form)).toEqual({
      secret: 'secret',
      response: 'token',
      remoteip: '203.0.113.1',
    })
  })

  it('throws TURNSTILE_FAILED when Cloudflare says no', async () => {
    const fetch = async () => jsonResponse({ success: false })
    await expect(verifyTurnstile({ fetch, secret: 's' }, 't', undefined)).rejects.toMatchObject({
      code: 'TURNSTILE_FAILED',
    })
  })

  it('throws UPSTREAM_ERROR when siteverify cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetch = async () => Promise.reject(new Error('offline'))
    await expect(verifyTurnstile({ fetch, secret: 's' }, 't', undefined)).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    })
  })
})

describe('sendContact', () => {
  it('posts the email to Resend with the visitor as reply_to', async () => {
    const fetch = vi.fn(async () => jsonResponse({ id: 'email-1' }))
    await sendContact({ fetch, ...email }, message)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer key' })
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: 'portfolio@example.com',
      to: ['owner@example.com'],
      reply_to: 'rina@example.com',
    })
  })

  it('throws UPSTREAM_ERROR when Resend fails or is not configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = async () => jsonResponse({ message: 'nope' }, 500)
    await expect(sendContact({ fetch: failing, ...email }, message)).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    })
    const unused = vi.fn()
    await expect(
      sendContact({ fetch: unused, ...email, apiKey: '' }, message),
    ).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' })
    expect(unused).not.toHaveBeenCalled()
  })
})
