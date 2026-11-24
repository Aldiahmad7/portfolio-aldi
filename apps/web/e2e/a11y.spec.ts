import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import { expect, test } from './fixtures'

/** WCAG 2.1 A + AA rules (docs/performance-a11y.md §5). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/** Serious and critical violations only, as "rule: selector" lines for a readable failure. */
async function seriousViolations(page: Page) {
  // The crew layer is decoration (aria-hidden, label contrast set in design-system §1); while cursors
  // fade in, axe measures half-transparent labels and reports false contrast failures.
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude('.build-layer')
    .analyze()
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`),
    )
}

test('the whole page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: copy.hud.skip, exact: true }).click()
  await page.locator('#guestbook').scrollIntoViewIfNeeded()
  await expect(page.getByText('Nice timeline!')).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('the page is accessible while the crew is building', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.build-cursor[data-visible]').first()).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('the command bar and comment mode are accessible', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: copy.hud.skip, exact: true }).click()
  await page.keyboard.press('/')
  await expect(page.getByRole('combobox', { name: copy.commandBar.label })).toBeFocused()
  expect(await seriousViolations(page)).toEqual([])
  await page.keyboard.press('Escape')

  await page.keyboard.press('c')
  await page.locator('#about').scrollIntoViewIfNeeded()
  await page.mouse.click(300, 400)
  await expect(page.getByLabel(copy.comments.nameLabel, { exact: true }).first()).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('keyboard only: skip link first, project details open with Enter and close with Esc', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: copy.hud.skipLink })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-build="project-featured"]')).toHaveCSS('opacity', '1')

  const card = page.locator('[data-build="project-featured"]')
  await card.focus()
  await page.keyboard.press('Enter')
  const details = page.getByRole('dialog')
  await expect(details).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
  await expect(card).toBeFocused()
})
