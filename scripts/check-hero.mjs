// Browser check for the hero's shader rings, on the dev server (no build needed).
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 5193, strictPort: true } })
await server.listen()
const origin = 'http://127.0.0.1:5193'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] })
const errors = []
const draws = page => page.evaluate(() => window.rings.draws)
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await context.addInitScript(() => {
    window.rings = { draws: 0, vec2: [], shaderErrors: [] }
    const proto = WebGLRenderingContext.prototype
    const draw = proto.drawArrays
    proto.drawArrays = function (...args) { window.rings.draws++; return draw.apply(this, args) }
    const uniform = proto.uniform2f
    proto.uniform2f = function (location, x, y) { window.rings.vec2.push([x, y]); return uniform.call(this, location, x, y) }
    const compile = proto.compileShader
    proto.compileShader = function (shader) {
      compile.call(this, shader)
      if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) window.rings.shaderErrors.push(this.getShaderInfoLog(shader))
    }
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  assert.equal(await page.locator('.hero-card > canvas.shader-lines').count(), 1, 'one ring canvas inside the hero card')
  assert.equal(await page.locator('.hero .tile').count(), 0, 'the Build / Automate / Care buttons are gone')
  const bounds = await page.locator('canvas.shader-lines').evaluate(canvas => {
    const c = canvas.getBoundingClientRect(), h = canvas.parentElement.getBoundingClientRect()
    return { position: getComputedStyle(canvas).position, events: getComputedStyle(canvas).pointerEvents, fits: Math.abs(c.width - h.width) < 2 && Math.abs(c.height - h.height) < 2, ready: 'ready' in canvas.dataset, overflow: document.documentElement.scrollWidth > innerWidth }
  })
  assert.deepEqual(bounds, { position: 'absolute', events: 'none', fits: true, ready: true, overflow: false })
  assert.deepEqual(await page.evaluate(() => window.rings.shaderErrors), [], 'shaders compile')

  const before = await draws(page)
  await page.waitForTimeout(300)
  assert.ok(await draws(page) > before, 'rings animate')
  const center = () => page.evaluate(() => window.rings.vec2.at(-1))
  const resting = await center()
  await page.mouse.move(1300, 200)
  await page.waitForTimeout(500)
  assert.notDeepEqual(await center(), resting, 'rings lean toward the pointer')
  await mkdir('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/hero-desktop.png' })

  await page.getByRole('button', { name: 'Pause background animation' }).click()
  await page.waitForTimeout(100)
  const paused = await draws(page)
  await page.waitForTimeout(300)
  assert.equal(await draws(page), paused, 'pause stops rendering')
  await page.getByRole('button', { name: 'Play background animation' }).click()
  await page.waitForTimeout(200)
  assert.ok(await draws(page) > paused, 'play resumes rendering')

  await page.evaluate(() => scrollTo({ top: 2400, behavior: 'instant' }))
  await page.waitForTimeout(400)
  const offscreen = await draws(page)
  await page.waitForTimeout(300)
  assert.equal(await draws(page), offscreen, 'off-screen hero stops rendering')
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(300)
  assert.ok(await draws(page) > offscreen, 're-entering the hero resumes')

  await page.locator('.hero-actions').getByRole('button', { name: "Let's Talk" }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(200)
  const reduced = await draws(page)
  await page.waitForTimeout(300)
  assert.equal(await draws(page), reduced, 'reduced motion holds a still frame')
  assert.equal(await page.locator('.hero-pause').count(), 0, 'no pause button when motion is off')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.waitForTimeout(200)

  await page.evaluate(() => {
    window.loseRings = document.querySelector('canvas.shader-lines').getContext('webgl').getExtension('WEBGL_lose_context')
    window.loseRings.loseContext()
  })
  await page.waitForTimeout(150)
  await page.evaluate(() => window.loseRings.restoreContext())
  await page.waitForTimeout(300)
  const restored = await draws(page)
  await page.waitForTimeout(250)
  assert.ok(await draws(page) > restored, 'context restoration restarts rendering')

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
    return { fillsScreen: card.height >= innerHeight - 20, copyAtBottom: card.bottom - copy.bottom < 40, ctaOnScreen: cta.bottom <= innerHeight, pauseClear: pause.bottom < copy.top }
  })
  assert.deepEqual(layout, { fillsScreen: true, copyAtBottom: true, ctaOnScreen: true, pauseClear: true })
  await mobile.screenshot({ path: 'artifacts/hero-mobile.png' })
  await mobile.getByRole('button', { name: 'Open menu', exact: true }).first().click()
  await mobile.getByRole('dialog', { name: 'Menu' }).waitFor()
  await mobile.getByRole('button', { name: 'Close menu' }).click()

  const fallback = await context.newPage()
  fallback.on('pageerror', error => errors.push(error.message))
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl' ? null : getContext.call(this, type, ...args) }
  })
  await fallback.goto(origin, { waitUntil: 'networkidle' })
  assert.ok(await fallback.locator('.hero-title').isVisible(), 'without WebGL the hero stays readable')
  assert.match(await fallback.locator('.hero-card').evaluate(el => getComputedStyle(el).backgroundImage), /radial-gradient/, 'without WebGL the glow stands in')
  assert.deepEqual(errors, [], 'no browser runtime errors')
  console.log('Passed: ring canvas fit, shader compilation, animation, pointer lean, pause/play, off-screen suspension, reduced motion, WebGL context restoration and fallback, CTA, mobile layout and menu.')
} finally {
  await browser.close()
  await server.close()
}
