// `npm run demo`: opens the real dashboard against the mock backend in a
// headed browser, logged in as a fictional admin, and pauses for exploration.
import { test } from '@playwright/test'

import { MockBackend } from './mock-api'

test('explore the dashboard with fictional data', async ({ page }) => {
  test.setTimeout(0)
  await new MockBackend({ loggedIn: true }).install(page)
  await page.goto('/dashboard/sessions')
  await page.pause()
})
