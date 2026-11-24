import { test as base, type Page } from '@playwright/test'

interface FakeComment {
  id: string
  section: string
  x: number
  y: number
  name: string
  message: string
  createdAt: number
}

/** Stand-in for Cloudflare's Turnstile script: renders nothing and hands out a token at once. */
const FAKE_TURNSTILE = `window.turnstile = {
  render(element, options) { setTimeout(() => options.callback('e2e-token')); return 'widget' },
  reset() {},
  remove() {},
}`

/**
 * `vite preview` has no API. Every test gets an in-memory fake of /api/* (same shapes as
 * docs/backend-api.md), so the smoke tests run offline and deterministic.
 */
export async function fakeApi(page: Page) {
  const comments: FakeComment[] = [
    {
      id: 'seed-1',
      section: 'about',
      x: 80,
      y: 30,
      name: 'Dina',
      message: 'Nice timeline!',
      createdAt: Date.UTC(2026, 10, 20),
    },
  ]
  let builds = 41
  const sent: unknown[] = []

  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_TURNSTILE }),
  )
  await page.route('**/api/builds', (route) => {
    if (route.request().method() === 'POST') builds++
    return route.fulfill({ json: { count: builds } })
  })
  await page.route('**/api/comments*', (route) => {
    if (route.request().method() !== 'POST') {
      return route.fulfill({ json: { items: comments, nextCursor: null } })
    }
    const input = route.request().postDataJSON() as Omit<FakeComment, 'id' | 'createdAt'>
    const item = { ...input, id: `new-${comments.length}`, createdAt: Date.now() }
    comments.unshift(item)
    return route.fulfill({ status: 201, json: { item } })
  })
  await page.route('**/api/contact', (route) => {
    sent.push(route.request().postDataJSON())
    return route.fulfill({ status: 202, json: { ok: true } })
  })
  return { sent }
}

/** The API is unreachable: every request fails at the network level. */
export async function apiDown(page: Page) {
  await page.route('**/api/**', (route) => route.abort('connectionrefused'))
}

/** `test` with the fake API installed before every page load. */
export const test = base.extend<{ api: Awaited<ReturnType<typeof fakeApi>> }>({
  api: [
    async ({ page }, use) => {
      await use(await fakeApi(page))
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
