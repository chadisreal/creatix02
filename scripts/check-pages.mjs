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
  assert.equal(await page.locator('.float-nav a[aria-current=page]').textContent(), 'Contact')

  await page.goBack()
  await page.waitForURL(origin + '/services')
  await settled(page)
  assert.ok(Math.abs(await landed(page, 'services') - 88) < 40, 'Back glides back to services')
  assert.ok(await sameMain() && await page.evaluate(() => window.stillHere), 'Back stays on the same page')

  // Reading down the page moves the address with you. Jump through Lenis where it is
  // active: a raw scrollTo gets overwritten on the next frame, because Lenis keeps its own
  // target and carries on animating toward the stale one.
  const jumpTo = y => page.evaluate(top => {
    if (window.__lenis) { window.__lenis.resize(); window.__lenis.scrollTo(top, { immediate: true }) }
    else scrollTo({ top, behavior: 'instant' })
  }, y)
  await jumpTo(await page.locator('#work').evaluate(el => el.getBoundingClientRect().top + scrollY - 88))
  await page.waitForURL(origin + '/portfolio')
  assert.equal(await page.title(), PAGES.find(r => r.path === '/portfolio').title)
  await jumpTo(0)
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

  // The hero's own in-page link glides into the page. It used to be four workflow steps
  // pointing at #process; the carousel's slide controls took that row, so this is now the
  // "See the work" link beside the frame counter.
  await page.goto(origin + '/', { waitUntil: 'networkidle' })
  await page.locator('.hero-dial').getByRole('link', { name: /See the work/ }).click()
  await page.waitForURL(origin + '/services')
  await settled(page)
  assert.ok(Math.abs(await landed(page, 'services') - 88) < 40, 'the hero link lands on the services section')

  // Arriving from search on a service page: a full page, and the nav takes you into the one page.
  await page.goto(origin + '/pos-billing-software', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('h1').textContent(), 'POS Billing Software')
  assert.equal(await page.locator('.hero-links a[aria-current=page]').textContent(), 'Expertise')
  await page.locator('.hero-links').getByRole('link', { name: 'Work' }).click()
  await page.waitForURL(origin + '/portfolio')
  await settled(page)
  assert.match(await page.locator('h1').textContent(), /Digital, with/)
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

  // Guards on this redesign's own failure modes.
  await page.goto(origin + '/', { waitUntil: 'networkidle' })
  const audit = await page.evaluate(() => {
    const lum = value => {
      const [r, g, b] = value.match(/[\d.]+/g).slice(0, 3).map(v => {
        const c = v / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    const onAccent = [], tiny = []
    for (const el of document.querySelectorAll('*')) {
      if (!el.firstChild || el.firstChild.nodeType !== 3 || !el.textContent.trim()) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || !el.getClientRects().length) continue
      // Accent-filled surfaces must carry near-black text: #fff on #34bb7b is 2.46:1.
      if (style.backgroundColor === 'rgb(52, 187, 123)') {
        const r = ratio(style.color, style.backgroundColor)
        if (r < 4.5) onAccent.push(`${el.tagName}.${el.className} ${r.toFixed(2)}:1`)
      }
      // Below ~10px the reference's micro-labels are illegible whatever the contrast.
      const size = parseFloat(style.fontSize)
      if (size < 10) tiny.push(`${el.tagName}.${el.className} ${size}px`)
    }
    return { onAccent, tiny, geist: document.fonts.check('1em Geist'), mono: document.fonts.check('1em "Geist Mono"') }
  })
  assert.deepEqual(audit.onAccent, [], 'accent-filled surfaces need near-black text')
  assert.deepEqual(audit.tiny, [], 'no rendered text below 10px')
  assert.ok(audit.geist, 'Geist loaded rather than silently falling back')
  assert.ok(audit.mono, 'Geist Mono loaded rather than silently falling back')

  // Reduced motion has to destroy Lenis rather than stop it. A stopped instance stays
  // installed: it keeps its classes on <html> and goes on consuming wheel events, so the
  // page would still feel hijacked by a visitor who asked for no motion.
  const calm = await context.newPage()
  await calm.emulateMedia({ reducedMotion: 'reduce' })
  await calm.goto(origin + '/', { waitUntil: 'networkidle' })
  await calm.waitForTimeout(1000)
  const quiet = await calm.evaluate(() => ({
    paused: document.documentElement.classList.contains('motion-paused'),
    lenisClass: document.documentElement.classList.contains('lenis'),
    handle: typeof window.__lenis,
  }))
  assert.deepEqual(quiet, { paused: true, lenisClass: false, handle: 'undefined' }, 'reduced motion destroys Lenis and leaves no trace of it')
  await calm.evaluate(() => scrollTo({ top: 1500, behavior: 'instant' }))
  await calm.waitForTimeout(300)
  assert.equal(await calm.evaluate(() => Math.round(scrollY)), 1500, 'with Lenis gone, native scrolling is exact')
  await calm.close()

  // The full-bleed hero uses 100vw and the marquees overflow by design: prove neither
  // leaks a sideways scrollbar, at the bottom of the page as well as the top.
  for (const width of [360, 400, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin + '/', { waitUntil: 'networkidle' })
    for (const where of ['top', 'bottom']) {
      await page.evaluate(y => scrollTo({ top: y === 'bottom' ? document.body.scrollHeight : 0, behavior: 'instant' }), where)
      await page.waitForTimeout(250)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      assert.ok(over <= 0, `${width}px scrolls sideways by ${over}px at the ${where}`)
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })

  // Old addresses from the previous site.
  await page.goto(origin + '/about.html', { waitUntil: 'networkidle' })
  assert.equal(page.url(), origin + '/about')
  await page.goto(origin + '/team', { waitUntil: 'networkidle' })
  assert.equal(page.url(), origin + '/about')
  // Static hosts answer unknown URLs with 404.html (Vite's preview server falls back to index.html instead).
  await page.goto(origin + '/404.html', { waitUntil: 'networkidle' })
  assert.match(await page.locator('h1').textContent(), /moved on/)
  assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex')
  await context.close()

  assert.deepEqual(problems, [], 'no console errors or hydration mismatches')
  console.log(`Passed: ${PAGES.length} addresses on desktop and mobile (status, clean URL, title, canonical, single h1, lands on its section, no overflow, no hydration errors), one-page glide + scroll-following address, Back, service sheet, service landing page, results rail, lead form, accent contrast, 10px floor, fonts loaded, Lenis destroyed under reduced motion, no sideways scroll at 360/400/1920, old URLs and 404.`)
} finally {
  await browser.close()
  await new Promise(done => server.httpServer.close(done))
}
