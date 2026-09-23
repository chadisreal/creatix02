// Screenshot the built site once every masked reveal has settled.
// The check scripts shoot as they go, which catches entrances mid-flight; reviewing a
// page whose headings animate in needs a frame taken after they have landed.
//   node scripts/shoot.mjs <out-dir>
import { chromium } from 'playwright-core'
import { preview } from 'vite'
const server = await preview({ preview: { host: '127.0.0.1', port: 5197, strictPort: true } })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp })
  await page.goto('http://127.0.0.1:5197/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)   // let every masked line settle
  await page.screenshot({ path: `${process.argv[2]}/settled-${name}.png` })
}
await browser.close(); await new Promise(d => server.httpServer.close(d))
