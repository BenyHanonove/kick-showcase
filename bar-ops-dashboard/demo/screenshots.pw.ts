// Static screenshots for docs/screenshots/ (light + dark), fictional data only.
import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'

import { MockBackend } from './mock-api'
import { MAIN_SESSION } from './fixtures'

const DIR = path.resolve(import.meta.dirname, '../../docs/screenshots')
const EVENT = `/dashboard/sessions/c-4/${MAIN_SESSION}`

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme })

    const open = async (page: Page, url: string) => {
      await new MockBackend({ loggedIn: true }).install(page)
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1200)
    }
    const save = (page: Page, name: string, fullPage = false) =>
      page.screenshot({ path: `${DIR}/${name}${scheme === 'dark' ? '-dark' : ''}.png`, fullPage })

    test(`events list (${scheme})`, async ({ page }) => {
      await open(page, '/dashboard/sessions')
      await expect(page.getByText('כל האירועים')).toBeVisible()
      await save(page, 'events-list')
    })

    test(`shift manager (${scheme})`, async ({ page }) => {
      await open(page, EVENT)
      await page.getByRole('tab', { name: 'משמרות' }).click()
      await page.waitForTimeout(800)
      await page.evaluate(() => window.scrollTo(0, 240))
      await page.waitForTimeout(400)
      await save(page, 'shift-manager')
    })

    test(`tips (${scheme})`, async ({ page }) => {
      await open(page, EVENT)
      await page.getByRole('tab', { name: 'טיפים' }).click()
      await page.waitForTimeout(800)
      await page.evaluate(() => window.scrollTo(0, 240))
      await page.waitForTimeout(400)
      await save(page, 'tips')
    })

    test(`event summary (${scheme})`, async ({ page }) => {
      await open(page, `${EVENT}/summary`)
      await expect(page.getByText('המדדים המובילים')).toBeVisible()
      await save(page, 'event-summary')
    })
  })
}
