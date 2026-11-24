import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import { apiDown, expect, test } from './fixtures'

/** Uncaught errors only: a refused request still logs "Failed to load resource" by design. */
function watchUncaught(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      errors.push(message.text())
    }
  })
  return errors
}

const skip = (page: Page) => page.getByRole('button', { name: copy.hud.skip, exact: true }).click()

test('without the API the page still works: guestbook offline, counter hidden', async ({
  page,
}) => {
  await page.unrouteAll()
  await apiDown(page)
  const errors = watchUncaught(page)
  await page.goto('/')
  await skip(page)
  await page.locator('#guestbook').scrollIntoViewIfNeeded()
  await expect(page.getByText(copy.guestbook.offline)).toBeVisible()
  await expect(page.getByText(/^Built \d/)).toHaveCount(0)
  await expect(page.locator('#contact input[name="name"]')).toBeVisible()
  expect(errors).toEqual([])
})

test('the counter shows the global build count after the first build', async ({ page }) => {
  await page.goto('/')
  await skip(page)
  await expect(page.locator('footer')).toContainText('Built 42 times')
})

test('a guestbook comment appears in the list', async ({ page }) => {
  await page.goto('/')
  await skip(page)
  const guestbook = page.locator('#guestbook')
  await guestbook.scrollIntoViewIfNeeded()
  await expect(guestbook.getByText('Nice timeline!')).toBeVisible()
  await guestbook.getByLabel(copy.comments.nameLabel, { exact: true }).fill('Rina')
  await guestbook.getByLabel(copy.comments.messageLabel, { exact: true }).fill('Halo crew!')
  await guestbook.getByRole('button', { name: copy.comments.submit }).click()
  await expect(guestbook.getByText(copy.comments.posted)).toBeVisible()
  await expect(guestbook.getByRole('list').getByText('Halo crew!')).toBeVisible()
})

test('comment mode: C shows pins, a click places a new one, Esc steps back', async ({ page }) => {
  await page.goto('/')
  await skip(page)
  await page.locator('#about').scrollIntoViewIfNeeded()
  await page.keyboard.press('c')
  const existing = page.getByRole('button', { name: copy.comments.commentFrom('Dina') })
  await expect(existing).toBeVisible()

  const about = await page.locator('#about').boundingBox()
  if (!about) throw new Error('About section has no box')
  await page.mouse.click(about.x + about.width * 0.25, about.y + about.height * 0.5)
  const draft = page.locator('#about')
  await expect(draft.getByLabel(copy.comments.nameLabel, { exact: true })).toBeFocused()
  await page.keyboard.type('Rina')
  await draft.getByLabel(copy.comments.messageLabel, { exact: true }).fill('Pin!')
  await draft.getByRole('button', { name: copy.comments.submit }).click()
  await expect(page.getByRole('button', { name: copy.comments.commentFrom('Rina') })).toBeVisible()

  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(existing).toHaveCount(0)
})

test('sending the contact form confirms and Pixel carries the envelope', async ({ page, api }) => {
  await page.goto('/')
  await page.locator('#contact').scrollIntoViewIfNeeded()
  const contact = page.locator('#contact')
  await expect(page.locator('[data-build="contact-submit"]')).toHaveCSS('opacity', '1', {
    timeout: 10_000,
  })
  await contact.getByLabel(copy.contact.nameLabel).fill('Rina')
  await contact.getByLabel(copy.contact.emailLabel).fill('rina@example.com')
  await contact.getByLabel(copy.contact.messageLabel).fill('Halo, mau ngobrol soal proyek.')
  // Red parks on the send button after the build (ADR 0005). Clicking its centre must still send:
  // a click without movement passes through the parked cursor.
  const send = await contact.getByRole('button', { name: copy.contact.submit }).boundingBox()
  if (!send) throw new Error('Send button has no box')
  await page.mouse.click(send.x + send.width / 2, send.y + send.height / 2)
  await expect(contact.getByText(copy.contact.sent)).toBeVisible()
  await expect(page.locator('.build-cursor[data-crew="pixel"][data-carrying]')).toHaveCount(1)
  expect(api.sent).toEqual([expect.objectContaining({ turnstileToken: 'e2e-token' })])
})
