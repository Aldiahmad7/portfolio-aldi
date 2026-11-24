import type { Page } from '@playwright/test'
import { copy } from '../src/app/copy'
import projects from '../src/content/data/projects.json' with { type: 'json' }
import { expect, test } from './fixtures'

const cards = (page: Page) =>
  page.locator('#project-list [data-build^="project-"]:not([data-build="project-stack"])')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: copy.hud.skip, exact: true }).click()
})

test('desktop: 6 projects fill the 3-column bento, so there is no stack', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.locator('[data-build="project-stack"]')).toBeHidden()
  for (const project of projects) {
    await expect(page.getByRole('button', { name: new RegExp(project.title) })).toBeVisible()
  }
})

test('phone: extra projects collapse into a stack that opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const stack = page.locator('[data-build="project-stack"]')
  await stack.scrollIntoViewIfNeeded()
  await expect(stack).toBeVisible()
  await expect(stack).toContainText(copy.projects.moreCount(2))
  const hiddenTitle = projects.at(-1)?.title ?? ''
  await expect(page.getByRole('button', { name: new RegExp(hiddenTitle) })).toBeHidden()

  await stack.click()
  await expect(page.getByRole('button', { name: new RegExp(hiddenTitle) })).toBeVisible()
  await expect(
    page.locator('#project-list li:not(:has([data-build="project-stack"])) button:focus'),
  ).toHaveCount(1)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)

  await page.getByRole('button', { name: copy.projects.showFewer }).click()
  await expect(page.getByRole('button', { name: new RegExp(hiddenTitle) })).toBeHidden()
  await expect(stack).toBeFocused()
  expect(await cards(page).count()).toBe(projects.length)
})
