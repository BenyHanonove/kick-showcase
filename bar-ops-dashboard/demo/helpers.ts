import type { Locator, Page } from '@playwright/test'

// Visible cursor + caption bar for recordings (headless video has no cursor)
export const OVERLAY_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo-cursor')) return
    const c = document.createElement('div')
    c.id = '__demo-cursor'
    c.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(20,20,20,.35);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35);pointer-events:none;transition:transform .12s;left:-50px;top:-50px'
    document.body.appendChild(c)
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    document.addEventListener('mousedown', () => { c.style.transform = 'scale(.7)' }, true)
    document.addEventListener('mouseup', () => { c.style.transform = 'scale(1)' }, true)
    const cap = document.createElement('div')
    cap.id = '__demo-caption'
    cap.dir = 'ltr'
    cap.style.cssText = 'position:fixed;z-index:2147483646;left:50%;top:12px;transform:translateX(-50%);max-width:1100px;padding:10px 20px;border-radius:12px;background:rgba(17,17,17,.88);color:#fff;font:600 17px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.1px;box-shadow:0 6px 24px rgba(0,0,0,.25);pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap'
    document.body.appendChild(cap)
  }
  if (document.body) install(); else document.addEventListener('DOMContentLoaded', install)
})()
`

export async function caption(page: Page, text: string | null) {
  await page.evaluate((t) => {
    const el = document.getElementById('__demo-caption')
    if (!el) return
    if (t) {
      el.innerHTML = t
      el.style.opacity = '1'
    } else {
      el.style.opacity = '0'
    }
  }, text)
}

export async function moveTo(page: Page, target: Locator, steps = 18) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('no bounding box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })
}

export async function click(page: Page, target: Locator, pause = 220) {
  await moveTo(page, target)
  await page.waitForTimeout(pause)
  await page.mouse.down()
  await page.waitForTimeout(70)
  await page.mouse.up()
}

// Briefly outline an element so a live change is easy to spot in the GIF
export async function flash(target: Locator, ms = 1600) {
  await target.evaluate((el, d) => {
    const e = el as HTMLElement
    e.style.setProperty('outline', '3px solid #10b981', 'important')
    e.style.setProperty('outline-offset', '3px', 'important')
    setTimeout(() => {
      e.style.removeProperty('outline')
      e.style.removeProperty('outline-offset')
    }, d)
  }, ms)
}

export async function smoothScroll(page: Page, y: number, ms = 900) {
  await page.evaluate(
    ([top, d]) =>
      new Promise<void>((resolve) => {
        const start = window.scrollY
        const t0 = performance.now()
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / d)
          const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
          window.scrollTo(0, start + (top - start) * ease)
          if (k < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    [y, ms] as const,
  )
}
