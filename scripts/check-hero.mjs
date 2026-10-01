// Browser check for the hero carousel, on the dev server (no build needed).
// Replaces the ring-shader checks: that component is retired to references/shader-rings.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 5193, strictPort: true } })
await server.listen()
const origin = 'http://127.0.0.1:5193'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
// The hold between frames in src/Hero.jsx, plus room for the crossfade.
const HOLD = 6500
const AFTER_HOLD = HOLD + 1400

try {
  await mkdir('artifacts', { recursive: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', m => m.type() === 'error' && errors.push(m.text()))
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // Which frame is showing: the number on the active tick ("01".."04").
  const count = (pg = page) => pg.locator('.hero-tick.is-on span').innerText()
  const ticks = page.locator('.hero-tick')

  // The stage fills the card, sits behind the type, and never takes the pointer.
  const stage = await page.locator('.hero-lines').first().evaluate(img => {
    const shot = img.getBoundingClientRect(), card = document.querySelector('.hero-card').getBoundingClientRect()
    return {
      fits: Math.abs(shot.width - card.width) < 2 && Math.abs(shot.height - card.height) < 2,
      events: getComputedStyle(img.parentElement).pointerEvents,
      dimmed: Number(getComputedStyle(img).opacity) < 1,
      behindCopy: Number(getComputedStyle(img.parentElement).zIndex) < Number(getComputedStyle(document.querySelector('.hero-copy')).zIndex),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
  assert.deepEqual(stage, { fits: true, events: 'none', dimmed: true, behindCopy: true, overflow: false })
  assert.equal(await page.locator('.hero-card canvas:not(.metal-rim canvas):not(.hero-lines)').count(), 0, 'the retired ring shader is gone')

  // Liquid metal: each nav surface carries a live shader rim (a WebGL canvas that actually drew
  // something) behind a black face inset 2px.
  const metal = await page.locator('.hero-links').evaluate(el => {
    const c = el.querySelector('.metal-rim canvas'), face = el.querySelector('.metal-face')
    const gl = c?.getContext('webgl2'), r = c?.getBoundingClientRect(), box = el.getBoundingClientRect()
    let lit = false
    if (gl) { const px = new Uint8Array(4); gl.readPixels(2, Math.floor(c.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); lit = px[3] > 0 }
    return { canvas: !!c, fills: !!r && Math.abs(r.width - box.width) < 2, face: !!face && getComputedStyle(face).inset === '2px', lit }
  })
  assert.deepEqual({ canvas: metal.canvas, fills: metal.fills, face: metal.face }, { canvas: true, fills: true, face: true })
  assert.equal(await ticks.count(), 4, 'one tick per service pillar')
  assert.equal(await count(), '01', 'starts at the first frame')

  // It advances on its own. This is the slowest assertion here and the reason it exists:
  // the slideshow moving unprompted is the whole point of the device.
  await page.waitForTimeout(AFTER_HOLD)
  assert.equal(await count(), '02', 'the carousel advances on its own')

  // The ticks are the controls, and taking over stops the autoplay.
  await ticks.nth(3).click()
  await page.waitForTimeout(400)
  assert.equal(await count(), '04', 'a tick jumps to its frame')
  await page.waitForTimeout(AFTER_HOLD)
  assert.equal(await count(), '04', 'picking a tick pauses the autoplay')
  await ticks.nth(0).click()
  await page.waitForTimeout(400)

  // Resume, then confirm the pause control holds it.
  await page.getByRole('button', { name: 'Resume the slideshow' }).click()
  await page.getByRole('button', { name: 'Pause the slideshow' }).waitFor()
  await page.getByRole('button', { name: 'Pause the slideshow' }).click()
  await page.waitForTimeout(AFTER_HOLD)
  assert.equal(await count(), '01', 'the pause control holds the frame')

  assert.ok(await page.locator('.hero-cta .pill-red').isVisible(), 'the primary call to action is visible')
  await page.screenshot({ path: 'artifacts/hero-desktop.png' })

  // Reduced motion: no autoplay, no pause control, and the active tick's rule held full
  // rather than sitting empty mid-animation.
  const calm = await context.newPage()
  calm.on('pageerror', error => errors.push(error.message))
  await calm.emulateMedia({ reducedMotion: 'reduce' })
  await calm.goto(origin, { waitUntil: 'networkidle' })
  await calm.waitForTimeout(1200)
  assert.equal(await calm.locator('.hero-pause').count(), 0, 'no pause control when motion is reduced')
  assert.equal(await count(calm), '01', 'reduced motion starts at the first frame')
  await calm.waitForTimeout(AFTER_HOLD)
  assert.equal(await count(calm), '01', 'reduced motion never auto-advances')
  assert.equal(
    await calm.locator('.hero-tick.is-on i').evaluate(el => getComputedStyle(el).animationName),
    'none',
    'the tick rule does not animate when motion is reduced',
  )
  await calm.close()

  // Mobile: the stage still fills the screen, the copy stays readable at the bottom, and
  // the pause control keeps clear of it.
  const mobile = await context.newPage()
  mobile.on('pageerror', error => errors.push(error.message))
  await mobile.setViewportSize({ width: 390, height: 844 })
  await mobile.goto(origin, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1500)
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile must not overflow')
  const layout = await mobile.evaluate(() => {
    const card = document.querySelector('.hero-card').getBoundingClientRect()
    const copy = document.querySelector('.hero-copy').getBoundingClientRect()
    const cta = document.querySelector('.hero-cta').getBoundingClientRect()
    const pause = document.querySelector('.hero-pause').getBoundingClientRect()
    return {
      fillsScreen: card.height >= innerHeight - 20,
      copyAtBottom: card.bottom - copy.bottom < 40,
      ctaOnScreen: cta.bottom <= innerHeight,
      pauseClear: pause.bottom < copy.top,
    }
  })
  assert.deepEqual(layout, { fillsScreen: true, copyAtBottom: true, ctaOnScreen: true, pauseClear: true })
  await mobile.screenshot({ path: 'artifacts/hero-mobile.png' })
  // The menu pill morphs open in place: links visible and focused, inside the viewport,
  // and Escape folds it back with focus returned to the pill.
  await mobile.getByRole('button', { name: 'Open menu', exact: true }).first().click()
  const menuNav = mobile.getByRole('navigation', { name: 'Menu' })
  await menuNav.waitFor()
  await mobile.waitForTimeout(900)
  const panel = await mobile.locator('.mm-surface').first().boundingBox()
  assert.ok(panel.x >= 0 && panel.x + panel.width <= 390 + 1, 'the open menu stays on screen')
  assert.equal(await mobile.evaluate(() => document.activeElement?.classList.contains('mm-item')), true, 'focus lands on the first link')
  await mobile.screenshot({ path: 'artifacts/menu-mobile.png' })
  await mobile.keyboard.press('Escape')
  await menuNav.waitFor({ state: 'hidden' })
  assert.equal(await mobile.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Open menu', 'focus returns to the pill')

  // Without the photography the hero still has to read: the gradient stands in.
  const bare = await context.newPage()
  bare.on('pageerror', error => errors.push(error.message))
  await bare.route('**/img/*.jpg', route => route.abort())
  await bare.goto(origin, { waitUntil: 'networkidle' })
  await bare.waitForTimeout(800)
  assert.ok(await bare.locator('.hero-title').isVisible(), 'without the imagery the hero stays readable')
  assert.match(
    await bare.locator('.hero-card').evaluate(el => getComputedStyle(el).backgroundImage),
    /radial-gradient/,
    'without the imagery the gradient stands in',
  )
  await bare.close()

  assert.deepEqual(errors, [], 'no browser runtime errors')
  await context.close()
  console.log('Passed: stage fit and dimming, autoplay, ticks, pause, reduced motion, mobile layout and menu, no-image fallback.')
} finally {
  await browser.close()
  await server.close()
}
