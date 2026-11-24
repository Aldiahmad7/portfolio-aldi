import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import { expect, test } from './fixtures'

const navbar = (page: Page) => page.getByRole('navigation', { name: copy.nav.label })

/** The section heading must sit below the sticky bar, not hidden under it. */
async function expectTitleBelowNavbar(page: Page, sectionId: string) {
  const bar = await navbar(page).boundingBox()
  const title = await page.locator(`#${sectionId}-title`).boundingBox()
  expect(bar).not.toBeNull()
  expect(title).not.toBeNull()
  if (!bar || !title) return
  expect(title.y).toBeGreaterThanOrEqual(bar.y + bar.height)
}

test('a navbar link jumps to its section below the sticky bar and marks it current', async ({
  page,
}) => {
  await page.goto('/')
  const link = navbar(page).getByRole('link', { name: copy.nav.sections.skills })
  await link.click()
  await expect(page).toHaveURL(/#skills$/)
  await expectTitleBelowNavbar(page, 'skills')
  await expect(link).toHaveAttribute('aria-current', 'location')
  await expect(navbar(page)).toBeInViewport()
})

test('on a phone the links live in a menu that closes after a choice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: copy.nav.menu })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await page.locator('#nav-menu').getByRole('link', { name: copy.nav.sections.projects }).click()
  await expect(page.locator('#nav-menu')).toBeHidden()
  await expectTitleBelowNavbar(page, 'projects')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})
