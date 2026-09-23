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

  const count = () => page.locator('.hero-count').innerText()
  const activeTick = () => page.locator('.hero-tick.is-on').innerText()
  const ticks = page.locator('.hero-tick')

  // The stage fills the card, sits behind the type, and never takes the pointer.
  const stage = await page.locator('.hero-shot').first().evaluate(img => {
    const shot = img.getBoundingClientRect(), card = document.querySelector('.hero-card').getBoundingClientRect()
    return {
      fits: Math.abs(shot.width - card.width) < 2 && Math.abs(shot.height - card.height) < 2,
      events: getComputedStyle(img.parentElement).pointerEvents,
      dimmed: getComputedStyle(img).filter.includes('brightness'),
      behindCopy: Number(getComputedStyle(img.parentElement).zIndex) < Number(getComputedStyle(document.querySelector('.hero-copy')).zIndex),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
  assert.deepEqual(stage, { fits: true, events: 'none', dimmed: true, behindCopy: true, overflow: false })
  assert.equal(await page.locator('.hero-card canvas').count(), 0, 'the retired ring shader is gone')
  assert.equal(await ticks.count(), 4, 'one tick per service pillar')
  assert.match(await count(), /^01\s*\/\s*04$/, 'the counter starts at the first frame')

  // It advances on its own. This is the slowest assertion here and the reason it exists:
  // the slideshow moving unprompted is the whole point of the device.
  await page.waitForTimeout(AFTER_HOLD)
  assert.match(await count(), /^02\s*\/\s*04$/, 'the carousel advances on its own')
  const second = await activeTick()

  // The arrows take over, which also stops the autoplay so the rest of this is deterministic.
  await page.getByRole('button', { name: 'Next discipline' }).click()
  await page.waitForTimeout(500)
  assert.match(await count(), /^03\s*\/\s*04$/, 'next advances a frame')
  assert.notEqual(await activeTick(), second, 'the active tick follows the frame')
  await page.getByRole('button', { name: 'Previous discipline' }).click()
  await page.waitForTimeout(500)
  assert.match(await count(), /^02\s*\/\s*04$/, 'previous goes back a frame')

  // Taking over must actually pause it: no drifting under the visitor.
  await page.waitForTimeout(AFTER_HOLD)
  assert.match(await count(), /^02\s*\/\s*04$/, 'using the arrows pauses the autoplay')

  // The ticks are also controls.
  await ticks.nth(3).click()
  await page.waitForTimeout(400)
  assert.match(await count(), /^04\s*\/\s*04$/, 'a tick jumps to its frame')
  await page.getByRole('button', { name: 'Next discipline' }).click()
  await page.waitForTimeout(400)
  assert.match(await count(), /^01\s*\/\s*04$/, 'the carousel wraps round')

  // Resume, then confirm the pause control holds it.
  await page.getByRole('button', { name: 'Resume the slideshow' }).click()
  await page.getByRole('button', { name: 'Pause the slideshow' }).waitFor()
  await page.getByRole('button', { name: 'Pause the slideshow' }).click()
  await page.waitForTimeout(AFTER_HOLD)
  assert.match(await count(), /^01\s*\/\s*04$/, 'the pause control holds the frame')

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
  assert.match(await calm.locator('.hero-count').innerText(), /^01\s*\/\s*04$/, 'reduced motion starts at the first frame')
  await calm.waitForTimeout(AFTER_HOLD)
  assert.match(await calm.locator('.hero-count').innerText(), /^01\s*\/\s*04$/, 'reduced motion never auto-advances')
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
  await mobile.getByRole('button', { name: 'Open menu', exact: true }).first().click()
  await mobile.getByRole('dialog', { name: 'Menu' }).waitFor()
  await mobile.getByRole('button', { name: 'Close menu' }).click()

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
  console.log('Passed: stage fit and dimming, autoplay, arrows, ticks, wrap, pause, reduced motion, mobile layout and menu, no-image fallback.')
} finally {
  await browser.close()
  await server.close()
}
