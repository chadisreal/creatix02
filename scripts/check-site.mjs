import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'

// Render every page without a browser, then verify links, images, sections and search metadata.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx')
  const { PAGES, SECTIONS, SECTION_ORDER, NOT_FOUND, REDIRECTS, SITE, findRoute, headTags } = await server.ssrLoadModule('/src/routes.js')
  const { SERVICES, TEAM, TESTIMONIALS } = await server.ssrLoadModule('/src/content.js')
  const paths = new Set(PAGES.map(route => route.path))
  const text = html => html.replace(/<[^>]*>/g, '')
  const images = new Set([...SERVICES, ...TEAM, ...TESTIMONIALS, ...PAGES].flatMap(item => [item.img, item.hero]).filter(Boolean))
  const html = {}
  let links = 0

  for (const route of [...PAGES, NOT_FOUND]) {
    const page = html[route.path] = render(route.path)
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
    assert.equal(new Set(ids).size, ids.length, `IDs must be unique on ${route.path}`)
    assert.equal([...page.matchAll(/<h1[\s>]/g)].length, 1, `${route.path} needs exactly one h1`)
    for (const [, href] of page.matchAll(/<a [^>]*href="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:)/.test(href)) continue
      const [path, hash] = href.split('#')
      if (path) {
        assert.ok(paths.has(path), `Broken link ${href} on ${route.path}`)
        links++
      }
      if (hash && path) assert.ok(render(path).includes(`id="${hash}"`), `Missing target ${href}`)
      if (hash && !path) assert.ok(ids.includes(hash), `Missing anchor #${hash} on ${route.path}`)
    }
    for (const [, src] of page.matchAll(/src="(\/[^"?#]+)"/g)) images.add(src)
    assert.ok(!headTags(route).includes('undefined'), `Incomplete head tags on ${route.path}`)
  }

  for (const image of images) assert.ok(existsSync(resolve('public', image.slice(1))), `Missing image ${image}`)
  for (const service of SERVICES) {
    assert.ok(paths.has('/' + service.slug), `No page for ${service.title}`)
    assert.ok(html['/services'].includes(`href="/${service.slug}"`), `Services page doesn't link to ${service.title}`)
  }
  assert.equal(new Set(PAGES.map(route => route.title)).size, PAGES.length, 'Page titles must be unique')
  assert.equal(new Set(PAGES.map(route => route.description)).size, PAGES.length, 'Descriptions must be unique')
  for (const [from, to] of Object.entries(REDIRECTS)) assert.equal(findRoute(from + '.html').path, to)
  assert.equal(findRoute('/about.html').path, '/about')

  // One page: every section address renders the whole site, in order, with its canonical link on the home page.
  for (const route of SECTIONS) {
    const at = SECTION_ORDER.map(id => html[route.path].indexOf(`id="${id}"`))
    assert.ok(at.every((pos, i) => pos > (at[i - 1] ?? -1)), `${route.path} must hold every section in order: ${at}`)
    assert.ok(headTags(route).includes(`rel="canonical" href="${SITE.url}/"`), `${route.path} canonical should be the home page`)
    assert.ok(route.section === 'top' || html[route.path].includes(`id="${route.section}"`), `${route.path} has no section to land on`)
  }
  for (const phrase of ['Motion:', 'Systems that make sense']) assert.ok(text(html['/']).includes(phrase), `Home missing: ${phrase}`)
  for (const route of PAGES.filter(r => r.page === 'service')) assert.ok(headTags(route).includes(`rel="canonical" href="${SITE.url}${route.path}"`), `${route.path} should be its own canonical page`)
  assert.ok(readFileSync('src/styles.css', 'utf8').includes('@media (max-width: 760px)'), 'Mobile layout missing')
  console.log(`Passed: ${PAGES.length} addresses + 404 rendered, one h1 each, unique IDs/titles/descriptions, ${links} internal links valid, ${images.size} images, all ${SERVICES.length} services have pages, redirects, one-page section order and canonical links.`)
} finally {
  await server.close()
}
