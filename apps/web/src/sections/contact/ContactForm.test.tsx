import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copy } from '../../app/copy'
import { BuildProvider } from '../../build/build-provider'
import { profile } from '../../content/profile'
import { CommentForm } from '../../components/comment-pin/CommentForm'
import { ContactForm } from './ContactForm'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key')
  // Turnstile answers at once with a token, like Cloudflare's test keys do.
  window.turnstile = {
    render: (_element, options) => {
      options.callback('turnstile-token')
      return 'widget-1'
    },
    reset: vi.fn(),
    remove: vi.fn(),
  }
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  delete window.turnstile
})

async function fillContact(email = 'rina@example.com') {
  const user = userEvent.setup()
  render(
    <BuildProvider>
      <ContactForm />
    </BuildProvider>,
  )
  await user.type(screen.getByLabelText(copy.contact.nameLabel), 'Rina')
  await user.type(screen.getByLabelText(copy.contact.emailLabel), email)
  await user.type(
    screen.getByLabelText(copy.contact.messageLabel),
    'Halo, mau ngobrol soal proyek.',
  )
  await user.click(screen.getByRole('button', { name: copy.contact.submit }))
}

describe('ContactForm', () => {
  it('flags invalid fields with the shared schema and sends nothing', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    await fillContact('not-an-email')
    expect(await screen.findByText(copy.contact.fieldErrors.email)).toBeInTheDocument()
    expect(screen.getByLabelText(copy.contact.emailLabel)).toHaveAttribute('aria-invalid', 'true')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the message with the Turnstile token and confirms', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true }, 202))
    await fillContact()
    expect(await screen.findByText(copy.contact.sent)).toBeInTheDocument()
    const [url, init] = fetch.mock.calls[0] ?? []
    expect(url).toBe('/api/contact')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: 'Rina',
      email: 'rina@example.com',
      turnstileToken: 'turnstile-token',
    })
    expect(screen.getByLabelText(copy.contact.nameLabel)).toHaveValue('')
  })

  it('offers a mailto link when the API is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await fillContact()
    expect(await screen.findByText(copy.apiErrors.OFFLINE, { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: profile.email })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
  })
})

describe('CommentForm', () => {
  it('posts at the given position and reports success', async () => {
    const item = {
      id: 'c-1',
      section: 'about',
      x: 12.5,
      y: 40,
      name: 'Rina',
      message: 'Keren!',
      createdAt: 1,
    }
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ item }, 201))
    const onPosted = vi.fn()
    const user = userEvent.setup()
    render(<CommentForm target={{ section: 'about', x: 12.5, y: 40 }} onPosted={onPosted} />)
    await user.type(screen.getByLabelText(copy.comments.nameLabel), 'Rina')
    await user.type(screen.getByLabelText(copy.comments.messageLabel), 'Keren!')
    await user.click(screen.getByRole('button', { name: copy.comments.submit }))
    expect(await screen.findByText(copy.comments.posted)).toBeInTheDocument()
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toMatchObject({
      section: 'about',
      x: 12.5,
      y: 40,
    })
    expect(onPosted).toHaveBeenCalledWith(item)
  })

  it('explains a rejected comment kindly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: { code: 'CONTENT_REJECTED', message: 'no' } }, 422),
    )
    const user = userEvent.setup()
    render(<CommentForm target={{ section: 'guestbook', x: 50, y: 50 }} />)
    await user.type(screen.getByLabelText(copy.comments.nameLabel), 'Rina')
    await user.type(screen.getByLabelText(copy.comments.messageLabel), 'hmm')
    await user.click(screen.getByRole('button', { name: copy.comments.submit }))
    expect(await screen.findByText(copy.apiErrors.CONTENT_REJECTED)).toBeInTheDocument()
  })
})
