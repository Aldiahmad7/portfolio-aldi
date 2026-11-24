import type { ContactInput } from '@cursor-crew/shared'
import { RESEND_EMAILS_URL } from '../config'
import { AppError } from '../errors'

interface ContactDependencies {
  fetch: typeof fetch
  apiKey: string
  to: string
  from: string
}

/** Sends the message through Resend's REST API; the visitor's address becomes `reply_to`. */
export async function sendContact(
  { fetch, apiKey, to, from }: ContactDependencies,
  input: Omit<ContactInput, 'turnstileToken'>,
): Promise<void> {
  if (!apiKey || !to || !from) {
    // Expected in local development: the page then falls back to a mailto link.
    console.error(
      'Contact email is not configured: RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL',
    )
    throw new AppError('UPSTREAM_ERROR')
  }
  const payload = {
    from,
    to: [to],
    reply_to: input.email,
    subject: `Portfolio message from ${input.name}`,
    text: `${input.message}\n\n${input.name} <${input.email}>`,
  }
  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (response.ok) return
    console.error('Resend rejected the email', response.status, await response.text())
  } catch (error) {
    console.error('Resend request failed', error)
  }
  throw new AppError('UPSTREAM_ERROR')
}
