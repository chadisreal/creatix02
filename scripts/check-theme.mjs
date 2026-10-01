// Browser check for the theme switch: run `npm run build` first.
// The switch is a branch plus persistence — this asserts the state flips, is announced,
// is stored, and wins before first paint. What the light palette looks like is a design
// review, not an assertion: an earlier version of this file tried to audit contrast and
// only ever found white-on-photograph false positives.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const origin = 'http://127.0.0.1:5195'
const server = await preview({ preview: { host: '127.0.0.1', port: 5195, strictPort: true } })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const problems = []

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.on('pageerror', e => problems.push('pageerror: ' + e.message))
  await page.goto(origin + '/', { waitUntil: 'networkidle' })

  const isLight = () => page.evaluate(() => document.documentElement.classList.contains('light'))
  assert.equal(await isLight(), false, 'starts dark')

  await page.locator('button[aria-label="Open menu"]:visible').first().click()
  await page.waitForTimeout(900)
  const sw = page.locator('.theme-toggle')
  assert.equal(await sw.count(), 1, 'the switch is in the menu')
  assert.equal(await sw.getAttribute('role'), 'switch', 'announced as a switch, not a button')
  assert.equal(await sw.getAttribute('aria-checked'), 'false', 'switch reports dark')

  const knobAt = () => page.locator('.theme-knob').evaluate(el => Math.round(el.getBoundingClientRect().x))
  const parked = await knobAt()

  await sw.click()
  await page.waitForTimeout(700)
  assert.equal(await sw.getAttribute('aria-checked'), 'true', 'switch reports light')
  assert.equal(await isLight(), true, 'html.light applied')
  assert.equal(await page.evaluate(() => localStorage.getItem('creatix-theme')), 'light', 'choice stored')
  assert.ok(await knobAt() - parked > 18, 'knob travelled across the track')
  // The tokens are what actually carry the theme; if they did not move, nothing else did.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  assert.equal(bg, 'rgb(242, 241, 237)', 'page background took the light token')
  // --navy is the feature-panel surface (results, page hero, tone-dark cards and sheets).
  // It aliases --paper in dark mode, so in light mode it used to turn white under white
  // text. Assert it stays dark: this is the one light token that cannot follow the page.
  const panel = await page.evaluate(() => getComputedStyle(document.querySelector('.results-card')).backgroundColor)
  assert.equal(panel, 'rgb(20, 22, 27)', 'the results panel stays a dark panel in light mode')
  const panelInk = await page.evaluate(() => getComputedStyle(document.querySelector('.results-card')).color)
  assert.equal(panelInk, 'rgb(255, 255, 255)', 'and keeps white ink on it')

  await sw.click()
  await page.waitForTimeout(700)
  assert.equal(await isLight(), false, 'switches back')
  assert.equal(await knobAt(), parked, 'knob returns to where it started')

  // The stored choice has to win before first paint, or a light-mode visitor gets a dark flash.
  await page.evaluate(() => localStorage.setItem('creatix-theme', 'light'))
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' })
  assert.equal(await isLight(), true, 'light applied before first paint on reload')

  assert.deepEqual(problems, [], problems.join('\n'))
  console.log('Passed: switch flips both ways, announces state, stores it, moves the knob, repaints the page tokens, and the stored choice lands before first paint.')
} finally {
  await browser.close()
  await server.close()
}
