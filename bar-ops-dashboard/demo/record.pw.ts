// Records docs/demo.mp4 (converted to docs/demo.gif by demo/make-gif.sh).
// The real SPA runs against the in-browser mock backend; all data is fictional.
import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

import { MockBackend } from './mock-api'
import { liveShift } from './fixtures'
import { OVERLAY_SCRIPT, caption, click, flash, moveTo, smoothScroll } from './helpers'

const OUT_DIR = path.resolve(import.meta.dirname, '.output')
const SHOTS = process.env.DEMO_SHOTS // optional: dump checkpoints for review

test('record demo', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    colorScheme: 'light',
  })
  const page = await context.newPage()
  const v0 = Date.now()
  const be = new MockBackend()
  await be.install(page)
  await page.addInitScript(OVERLAY_SCRIPT)
  const shot = async (name: string) => {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` })
  }

  // Warm the dev server so the video does not start on a blank page
  await page.goto('/dashboard/login')
  await expect(page.getByLabel('אימייל')).toBeVisible({ timeout: 60_000 })
  await page.waitForTimeout(500)
  const t0 = Date.now()

  // 1. Login
  await caption(page, 'KICK &middot; real-time operations for event bars &middot; demo with fictional data')
  await click(page, page.getByLabel('אימייל'))
  await page.getByLabel('אימייל').fill('manager@kick.example')
  await page.waitForTimeout(300)
  await click(page, page.locator('input[type=password]'))
  await page.locator('input[type=password]').fill('demo-password')
  await page.waitForTimeout(300)
  await click(page, page.locator('.auth-submit'))

  // 2. Events list
  await expect(page.getByText('כל האירועים')).toBeVisible()
  await caption(page, 'Events this month &middot; Vue 3 + Pinia, Hebrew / RTL')
  await page.waitForTimeout(1200)
  await shot('01-list')
  const card = page.locator('.v-card', { hasText: 'פסטיבל חוף הזהב' }).last()
  await smoothScroll(page, 300)
  await page.waitForTimeout(300)
  await click(page, card.getByText('ניהול'))

  // 3. Event -> shifts tab
  await expect(page.getByRole('tab', { name: 'משמרות' })).toBeVisible()
  await caption(page, 'One event: consumption, cashiers, shifts, tips, expenses, tasks')
  await page.waitForTimeout(1050)
  await click(page, page.getByRole('tab', { name: 'משמרות' }))
  await page.waitForTimeout(550)
  await smoothScroll(page, 330)
  await page.waitForTimeout(400)
  await shot('02-shifts')

  // 4. Live update: another manager adds a shift elsewhere
  await caption(
    page,
    'Another manager adds a shift &rarr; DynamoDB Stream &rarr; WebSocket <code>{action, id}</code> &rarr; this tab refetches',
  )
  await page.waitForTimeout(1300)
  be.insert('shift', { ...liveShift, timestamp: new Date().toISOString() })
  be.push('CREATE', 'shift', liveShift.id)
  const newRow = page.locator('.v-card', { hasText: 'עמית לבנון' }).last()
  await expect(newRow).toBeVisible()
  await flash(newRow, 2200)
  await moveTo(page, newRow)
  await page.waitForTimeout(1750)
  await shot('03-live')

  // 5. Tips: a cashier edit elsewhere re-splits the tip pool live
  await smoothScroll(page, 0, 500)
  await click(page, page.getByRole('tab', { name: 'טיפים' }))
  await caption(page, 'Tips split by hours &middot; updates arrive live, through the same role-guarded REST API')
  await page.waitForTimeout(1050)
  be.mutate('tips', 't-bar', { cashTip: 3620 })
  be.push('UPDATE', 'tips', 't-bar')
  await page.waitForTimeout(200)
  await flash(page.locator('.v-card', { hasText: 'טיפים בר' }).last(), 1800)
  await page.waitForTimeout(1500)
  await shot('04-tips')

  // 6. Closing wizard
  await caption(page, 'End of night: a 6-step closing wizard blocks locking until every check passes')
  await click(page, page.getByRole('button', { name: 'פעולות' }).first())
  await page.waitForTimeout(300)
  await click(page, page.getByText('סגור אירוע'))
  const next = page.getByRole('button', { name: 'המשך' })
  await expect(next).toBeVisible()
  await page.waitForTimeout(700)
  await click(page, next) // 1 consumption loss
  await page.waitForTimeout(400)
  await click(page, page.getByText('אני מאשר שהסכומים תואמים'))
  await page.waitForTimeout(300)
  await shot('05-wizard-cashiers')
  await click(page, next) // 2 cashiers
  await page.waitForTimeout(550)
  await click(page, page.getByRole('button', { name: /אשר את כל המשמרות/ }))
  await page.waitForTimeout(700)
  await click(page, next) // 3 shifts
  await page.waitForTimeout(400)
  await click(page, page.getByText('אני מאשר כי כל הוצאות הקופה נרשמו ותקינות'))
  await page.waitForTimeout(300)
  await click(page, next) // 4 expenses
  await page.waitForTimeout(550)
  await click(page, next) // 5 payouts
  await page.waitForTimeout(550)
  await click(page, page.getByRole('button', { name: 'נעל אירוע' }))

  // 7. Summary report
  await expect(page.getByText('המדדים המובילים')).toBeVisible()
  await caption(page, 'Locked &rarr; event summary: margins, labor cost, tips, stock leakage')
  await page.waitForTimeout(1350)
  await shot('06-summary')
  await smoothScroll(page, 760, 1800)
  await page.waitForTimeout(1300)
  await caption(page, null)

  console.log(`flow duration: ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  fs.writeFileSync(path.join(OUT_DIR, 'trim.json'), JSON.stringify({ startMs: t0 - v0, flowMs: Date.now() - t0 }))
  expect(be.unhandled).toEqual([])
  const video = page.video()
  await context.close()
  if (video) fs.copyFileSync(await video.path(), path.join(OUT_DIR, 'demo-raw.webm'))
})
