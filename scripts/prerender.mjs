// Runs after `vite build`: writes one real HTML page per route, plus sitemap.xml, robots.txt and 404.html.
// Pages are flat files (about.html); vercel.json's cleanUrls serves them at /about.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = resolve('dist')
const ssr = resolve('dist-ssr')
const { render, PAGES, NOT_FOUND, SITE, headTags, pageUrl } = await import(pathToFileURL(resolve(ssr, 'entry-server.js')).href)
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
if (!template.includes('<!--app-html--></div>')) throw new Error('index.html needs <div id="root"><!--app-html--></div>')

const write = (name, content) => {
  const file = resolve(dist, name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}
// Section addresses (/contact) open at their section straight away, before the app's script has loaded.
const jump = route => route.section && route.section !== 'top'
  ? `<script>document.getElementById(${JSON.stringify(route.section)})?.scrollIntoView({ behavior: 'instant' })</script>`
  : ''
const page = (url, route) => template
  .replace('<!--app-head-->', headTags(route))
  .replace('<!--app-html--></div>', render(url) + '</div>' + jump(route))

for (const route of PAGES) write(route.path === '/' ? 'index.html' : route.path.slice(1) + '.html', page(route.path, route))
write('404.html', page(NOT_FOUND.path, NOT_FOUND))

// Section addresses point their canonical link at the home page, so only real pages go in the sitemap.
const listed = PAGES.filter(route => !route.canonical)
const today = new Date().toISOString().slice(0, 10)
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${listed.map(route => `  <url><loc>${pageUrl(route)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`)
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`)

rmSync(ssr, { recursive: true, force: true })
console.log(`Prerendered ${PAGES.length} addresses, 404.html, sitemap.xml (${listed.length} pages) and robots.txt.`)
