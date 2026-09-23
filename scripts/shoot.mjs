// Screenshot the built site once every masked reveal has settled.
// The check scripts shoot as they go, which catches entrances mid-flight; reviewing a page
// whose headings animate in needs frames taken after they have landed.
//   npm run build && node scripts/shoot.mjs <out-dir>
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const out = process.argv[2] ?? 'artifacts/shots'
const port = 5199
const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const origin = `http://127.0.0.1:${port}`
const SETTLE = 2200 // longest reveal is 1.2s, plus stagger

try {
  await mkdir(out, { recursive: true })
  for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport })
    await page.goto(origin + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(SETTLE)
    await page.screenshot({ path: `${out}/${label}-00-hero.png` })

    // Walk the page in viewport-sized steps so every band gets a settled frame.
    const height = await page.evaluate(() => document.body.scrollHeight)
    const step = Math.round(viewport.height * 0.85)
    for (let i = 1, y = step; y < height; i++, y += step) {
      await page.evaluate(to => scrollTo({ top: to, behavior: 'instant' }), y)
      await page.waitForTimeout(SETTLE)
      await page.screenshot({ path: `${out}/${label}-${String(i).padStart(2, '0')}.png` })
    }
    await page.close()
  }
  console.log('Settled frames written to ' + out)
} finally {
  await browser.close()
  await new Promise(done => server.httpServer.close(done))
}
