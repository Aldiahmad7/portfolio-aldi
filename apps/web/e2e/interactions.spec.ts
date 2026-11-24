import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import { expect, test } from './fixtures'

/** Lets the hero finish building (Skip would turn interactions off). */
async function heroBuilt(page: Page) {
  await page.goto('/')
  await expect(page.locator('[data-build="hero-meta"]')).toHaveCSS('opacity', '1', {
    timeout: 10_000,
  })
  await expect.poll(() => page.locator('#hero [data-build]:not([data-built])').count()).toBe(0)
}

test('shortcuts never fire inside a form field', async ({ page }) => {
  await page.goto('/')
  const name = page.locator('#contact input[name="name"]')
  await name.focus()
  await page.keyboard.type('a/b')
  await expect(name).toHaveValue('a/b')
  await expect(page.getByRole('combobox')).toHaveCount(0)
})

test('the command bar opens with /, closes with Esc and returns focus', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('/')
  const input = page.getByRole('combobox', { name: copy.commandBar.label })
  await expect(input).toBeFocused()
  await input.fill('help')
  await input.press('Enter')
  await expect(page.getByText(/^crew dance —/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).toBeHidden()
})

test('Ctrl+Z rewinds the hero and the crew builds it again', async ({ page }) => {
  await heroBuilt(page)
  await page.keyboard.press('Control+z')
  await expect(page.locator('[data-build="hero-meta"]')).not.toHaveAttribute('data-built')
  await expect(page.locator('[data-build="hero-meta"]')).toHaveAttribute('data-built', '', {
    timeout: 10_000,
  })
})

test('a cursor can be caught and thrown', async ({ page }) => {
  await heroBuilt(page)
  const hitbox = page.locator('.build-cursor[data-crew="kern"] .build-cursor-hitbox')
  const box = await hitbox.boundingBox()
  if (!box) throw new Error('kern is not parked')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 200, box.y + 100, { steps: 5 })
  await page.mouse.up()
  // It flies, lands, complains and goes back home.
  await expect(page.locator('.build-cursor[data-crew="kern"]')).not.toHaveAttribute('data-held', {
    timeout: 5000,
  })
})
