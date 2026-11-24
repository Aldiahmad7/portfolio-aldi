import { TURNSTILE_VERIFY_URL } from '../config'
import { AppError } from '../errors'

interface TurnstileDependencies {
  fetch: typeof fetch
  secret: string
}

/** Server-side Turnstile check (siteverify). Throws `TURNSTILE_FAILED` unless Cloudflare says success. */
export async function verifyTurnstile(
  { fetch, secret }: TurnstileDependencies,
  token: string,
  remoteIp: string | undefined,
): Promise<void> {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (remoteIp) form.append('remoteip', remoteIp)

  let body: unknown
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
    body = await response.json()
  } catch (error) {
    console.error('Turnstile siteverify failed', error)
    throw new AppError('UPSTREAM_ERROR')
  }
  const success = typeof body === 'object' && body !== null && 'success' in body && body.success
  if (success !== true) throw new AppError('TURNSTILE_FAILED')
}
