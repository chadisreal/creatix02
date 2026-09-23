// Browser check for the built, prerendered site: run `npm run build` first.
// Loads every address, checks hydration and SEO tags, then scrolls and clicks through the one-page navigation.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const shots = process.env.SHOTS // optional folder for screenshots
const origin = 'http://127.0.0.1:5194'
const server = await preview({ preview: { host: '127.0.0.1', port: 5194, strictPort: true } })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const { PAGES, SITE, headTags } = await import('../src/routes.js')
const problems = []
// Where a section sits in the viewport: near the top, below the floating nav.
const landed = (page, id) => page.locator('#' + id).evaluate(el => el.getBoundingClientRect().top)
const settled = page => page.waitForTimeout(1400) // smooth scrolling plus the address catching up

try {
  if (shots) await mkdir(shots, { recursive: true })
  for (const [label, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport })
    for (const route of PAGES) {
      const page = await context.newPage()
      page.on('console', m => m.type() === 'error' && problems.push(`${label} ${route.path}: ${m.text()}`))
      page.on('pageerror', e => problems.push(`${label} ${route.path}: ${e.message}`))
      const response = await page.goto(origin + route.path, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200, route.path)
      assert.equal(new URL(page.url()).pathname, route.path, 'URL stays clean')
      assert.equal(await page.title(), route.title)
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), SITE.url + (route.canonical ?? route.path))
      assert.equal(await page.locator('h1').count(), 1, `one h1 on ${route.path}`)
      const heads = headTags(route).match(/data-head/g).length
      assert.equal(await page.locator('head [data-head]').count(), heads, `head tags not duplicated on ${route.path}`)
      if (route.section && route.section !== 'top') {
        await settled(page)
        const top = await landed(page, route.section)
        assert.ok(top > -10 && top < 500, `${label} ${route.path} opens at its section (top ${top})`)
        assert.equal(new URL(page.url()).pathname, route.path, `${label} ${route.path} address holds after landing`)
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      assert.ok(overflow <= 0, `${label} ${route.path} scrolls sideways by ${overflow}px`)
      if (shots && (route.page !== 'service' || route.service === 'crm')) {
        await page.screenshot({ path: `${shots}/${label}-${route.path.slice(1) || 'home'}.png` })
      }
      await page.close()
    }
    await context.close()
  }

  // One page: nav links glide to sections, the address follows, nothing reloads.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', e => problems.push(`navigation: ${e.message}`))
  await page.goto(origin + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { window.stillHere = true })
  const mainNode = await page.locator('main').elementHandle()
  const sameMain = () => page.evaluate(el => el.isConnected, mainNode)

  await page.locator('.hero-links').getByRole('link', { name: 'Expertise' }).click()
  await page.waitForURL(origin + '/services')
  await settled(page)
  assert.equal(await page.evaluate(() => window.stillHere), true, 'navigation must not reload the page')
  assert.ok(await sameMain(), 'section links scroll the same page instead of swapping it')
  assert.equal(await page.title(), PAGES.find(r => r.path === '/services').title)
  assert.ok(Math.abs(await landed(page, 'services') - 88) < 40, 'Expertise lands on the services section')
  assert.equal(new URL(page.url()).pathname, '/services', 'address stays on the section it glided to')

  await page.locator('.float-nav').getByRole('link', { name: 'Contact' }).click()
  await page.waitForURL(origin + '/contact')
  await settled(page)
  assert.ok(await landed(page, 'contact') < 500, 'Contact lands on the contact section')
  assert.equal(await page.locator('.float-nav a[aria-current=page]').innerText(), 'Contact')

  await page.goBack()
  await page.waitForURL(origin + '/services')
  await settled(page)
  assert.ok(Math.abs(await landed(page, 'services') - 88) < 40, 'Back glides back to services')
  assert.ok(await sameMain() && await page.evaluate(() => window.stillHere), 'Back stays on the same page')

  // Reading down the page moves the address with you.
  await page.locator('#work').evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 88, behavior: 'instant' }))
  await page.waitForURL(origin + '/portfolio')
  assert.equal(await page.title(), PAGES.find(r => r.path === '/portfolio').title)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForURL(origin + '/')

  // A service opens over the page at its own address, and closes back to where you were.
  await page.locator('#services').getByRole('link', { name: /POS Billing Software/ }).first().click()
  await page.waitForURL(origin + '/pos-billing-software')
  const sheet = page.getByRole('dialog', { name: 'POS Billing Software' })
  await sheet.waitFor()
  const behind = await page.evaluate(() => scrollY)
  assert.ok(await sameMain(), 'the page stays behind the service sheet')
  assert.equal(await page.title(), PAGES.find(r => r.path === '/pos-billing-software').title)
  await page.keyboard.press('Escape')
  await sheet.waitFor({ state: 'detached' })
  await page.waitForURL(url => url.pathname !== '/pos-billing-software')
  assert.equal(await page.evaluate(() => scrollY), behind, 'closing the sheet keeps your place')

  await page.goto(origin + '/', { waitUntil: 'networkidle' })
  await page.locator('.hero-foot').getByRole('link', { name: /Design/ }).click()
  await page.waitForURL(origin + '/services')
  await settled(page)
  assert.ok(Math.abs(await landed(page, 'process')) < 150, 'hero step links land on the process section')

  // Arriving from search on a service page: a full page, and the nav takes you into the one page.
  await page.goto(origin + '/pos-billing-software', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('h1').innerText(), 'POS Billing Software')
  assert.equal(await page.locator('.hero-links a[aria-current=page]').innerText(), 'Expertise')
  await page.locator('.hero-links').getByRole('link', { name: 'Work' }).click()
  await page.waitForURL(origin + '/portfolio')
  await settled(page)
  assert.match(await page.locator('h1').innerText(), /Digital, with/)
  assert.ok(Math.abs(await landed(page, 'work') - 88) < 40, 'Work lands on the results section')

  // Client results rail: arrows move the cards and dim at either end.
  for (const width of [1920, 1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(origin + '/portfolio', { waitUntil: 'networkidle' })
    await page.locator('.results-head').scrollIntoViewIfNeeded()
    const railX = () => page.locator('.rail').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)
    const prev = page.getByRole('button', { name: 'Previous case' }), next = page.getByRole('button', { name: 'Next case' })
    assert.ok(await prev.isDisabled(), `${width}: previous starts disabled`)
    await next.click()
    await page.waitForTimeout(900)
    assert.ok(await railX() < -100, `${width}: next arrow moves the cards`)
    for (let i = 0; i < 6 && !(await next.isDisabled()); i++) { await next.click(); await page.waitForTimeout(900) }
    assert.ok(await next.isDisabled(), `${width}: next disables at the last card`)
    const end = await railX()
    await prev.click()
    await page.waitForTimeout(900)
    assert.ok(await railX() > end + 50, `${width}: previous arrow moves back`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })

  // The lead form is the money path: intercept the API and prove the phone is normalised before it is sent.
  await page.goto(origin + '/', { waitUntil: 'networkidle' })
  let posted = null
  await page.route('**/api/send-lead', async route => {
    posted = route.request().postDataJSON()
    await route.fulfill({ json: { ok: true } })
  })
  await page.locator('.hero-actions').getByRole('button', { name: /Let.s Talk/ }).click()
  await page.getByRole('dialog', { name: /Let.s talk/ }).waitFor()
  await page.fill('#name', 'Test Lead')
  await page.fill('#phone', '12345')
  await page.locator('.form-submit').click()
  await page.locator('#phone-err').waitFor()
  assert.equal(posted, null, 'an invalid phone must never reach the API')

  // A +91 prefix and spaces still arrive as ten bare digits.
  await page.fill('#phone', '+91 98765 43210')
  await page.locator('.form-submit').click()
  await page.locator('.sent').waitFor()
  assert.equal(posted.phone, '9876543210', 'phone normalised before sending')
  assert.equal(posted.name, 'Test Lead', 'name reaches the API')
  assert.equal(posted.company, undefined, 'honeypot must arrive empty')
  await page.unroute('**/api/send-lead')

  // Old addresses from the previous site.
  await page.goto(origin + '/about.html', { waitUntil: 'networkidle' })
  assert.equal(page.url(), origin + '/about')
  await page.goto(origin + '/team', { waitUntil: 'networkidle' })
  assert.equal(page.url(), origin + '/about')
  // Static hosts answer unknown URLs with 404.html (Vite's preview server falls back to index.html instead).
  await page.goto(origin + '/404.html', { waitUntil: 'networkidle' })
  assert.match(await page.locator('h1').innerText(), /moved on/)
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex')
  await context.close()

  assert.deepEqual(problems, [], 'no console errors or hydration mismatches')
  console.log(`Passed: ${PAGES.length} addresses on desktop and mobile (status, clean URL, title, canonical, single h1, lands on its section, no overflow, no hydration errors), one-page glide + scroll-following address, Back, service sheet, service landing page, results rail, lead form, old URLs and 404.`)
} finally {
  await browser.close()
  await new Promise(done => server.httpServer.close(done))
}
