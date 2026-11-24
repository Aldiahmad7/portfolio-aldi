import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import { expect, fakeApi, test } from './fixtures'

const hud = (page: Page) => page.getByRole('complementary', { name: copy.hud.label })

/** Collects uncaught errors and console errors for the whole test. */
function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

const allTargetsVisible = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-build]')].every(
      (element) => getComputedStyle(element).opacity === '1',
    ),
  )

test('the crew builds the hero while the HUD shows progress', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-build-root', 'pending')
  await expect(hud(page)).toContainText(copy.hud.building)
  await expect(page.locator('.build-cursor[data-visible]').first()).toBeVisible()
  await expect(page.locator('[data-build="hero-title"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-build="hero-actions"]')).toHaveCSS('opacity', '1')
  expect(errors).toEqual([])
})

test('Skip shows every section at once and hides the HUD', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: copy.hud.skip, exact: true }).click()
  await expect(hud(page)).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-build-root')
  await expect.poll(() => allTargetsVisible(page)).toBe(true)

  await page.reload()
  await expect(page.locator('html')).not.toHaveAttribute('data-build-root')
})

test('reduced motion shows the content at once, without HUD or cursors', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await fakeApi(page)
  const errors = watchErrors(page)
  await page.goto('/')
  expect(await allTargetsVisible(page)).toBe(true)
  await expect(hud(page)).toHaveCount(0)
  await expect(page.locator('.build-cursor')).toHaveCount(0)
  expect(errors).toEqual([])
  await context.close()
})

test('scrolling to the bottom builds every section without errors', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  for (const id of ['about', 'projects', 'skills', 'guestbook', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} [data-build]`).first()).toHaveCSS('opacity', '1')
  }
  await expect.poll(() => allTargetsVisible(page), { timeout: 10_000 }).toBe(true)
  // Nothing transformed or painted is left behind once the crew is done.
  await expect(page.locator('.build-fill, .build-rect, .build-select, .build-clone')).toHaveCount(0)
  expect(errors).toEqual([])
})
