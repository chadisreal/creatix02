// Every address on the site: its URL, search title and description.
// The home page is one long page. /about, /services, /portfolio and /contact are addresses for its sections:
// they share its content, so their canonical link points at the home page. Each service has its own page.
// The build prerenders one HTML file per route (scripts/prerender.mjs) and the app swaps head tags as the address changes.
import { CATEGORIES, CONTACT, FAQ, SERVICES } from './content.js'

export const SITE = {
  name: 'Creatix Innovation',
  url: 'https://creatixinnovation.com',
  image: '/img/og-image.jpg',
}

const CATEGORY_HERO = { build: '/img/build.jpg', systems: '/img/circuit.jpg', growth: '/img/glass-sculpture.webp', care: '/img/care.jpg' }

export const PAGES = [
  {
    path: '/', page: 'home', section: 'top',
    title: 'Creatix Innovation | Website, App, CRM & ERP Development in Jaipur',
    description: 'Creatix Innovation is a full-stack IT & digital agency in Jaipur building websites, mobile apps, CRM, ERP and POS software, business automation, branding and digital marketing.',
  },
  {
    path: '/about', page: 'home', section: 'about', canonical: '/', name: 'Studio',
    title: 'About Creatix Innovation | IT & Digital Agency in Jaipur',
    description: 'Meet Creatix Innovation, the Jaipur IT and digital agency founded in 2015. 150+ projects delivered, 99% client satisfaction and 24/7 dedicated support.',
  },
  {
    path: '/services', page: 'home', section: 'services', canonical: '/', name: 'Expertise',
    title: 'IT & Digital Services in Jaipur | Creatix Innovation',
    description: 'Website and app development, CRM, ERP, POS billing, HRMS, Salesforce, business automation, UI/UX, branding, video and digital marketing from one Jaipur team.',
  },
  {
    path: '/portfolio', page: 'home', section: 'work', canonical: '/', name: 'Work',
    title: 'Portfolio & Client Results | Creatix Innovation',
    description: 'See how CRM, ERP, POS and custom apps by Creatix Innovation cut lead response to 15 seconds, stopped inventory leaks and sped up billing for Indian businesses.',
  },
  {
    path: '/contact', page: 'home', section: 'contact', from: 'faq', canonical: '/', name: 'Contact',
    title: 'Contact Creatix Innovation | Book a Free Live Demo in Jaipur',
    description: `Talk to Creatix Innovation in Jaipur about a website, app, CRM, ERP or automation project. Call or WhatsApp ${CONTACT.phone}, ${CONTACT.hours}.`,
  },
  ...SERVICES.map(s => ({
    path: '/' + s.slug, page: 'service', service: s.id, name: s.title, parent: '/services', hero: s.img ?? CATEGORY_HERO[s.cat],
    title: `${s.title} in Jaipur | Creatix Innovation`,
    description: `${s.short} ${CATEGORIES.find(c => c.id === s.cat).label} by Creatix Innovation, Jaipur. Book a free live demo.`,
  })),
]

export const NOT_FOUND = {
  path: '/404', page: 'not-found', noindex: true, hero: '/img/glass-sculpture.webp',
  title: 'Page not found | Creatix Innovation',
  description: 'The page you were looking for has moved. Explore Creatix Innovation’s services, work and studio.',
}

// Section addresses in page order. `from` is where the address takes over while scrolling, if not the section itself.
export const SECTIONS = PAGES.filter(route => route.section)

// Every section on the one page, in render order. The one-page order check reads this,
// so sections that are added, cut or reordered are updated here and nowhere else.
export const SECTION_ORDER = ['top', 'about', 'services', 'process', 'work', 'team', 'faq', 'contact']

// Addresses from the previous site that now live elsewhere.
export const REDIRECTS = { '/team': '/about', '/experience': '/about' }

export function normalizePath(pathname) {
  let p = pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  if (p === '/index') p = '/'
  return REDIRECTS[p] ?? p
}

export const findRoute = pathname => {
  const p = normalizePath(pathname)
  return PAGES.find(r => r.path === p) ?? NOT_FOUND
}

export const pageUrl = route => SITE.url + route.path
export const canonicalUrl = route => SITE.url + (route.canonical ?? route.path)

const esc = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Tags carry data-head so the client can replace them when the page changes.
export function headTags(route) {
  const url = pageUrl(route)
  const image = SITE.url + SITE.image
  const tags = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}">`,
    route.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonicalUrl(route)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:locale" content="en_IN">`,
    `<meta property="og:title" content="${esc(route.title)}">`,
    `<meta property="og:description" content="${esc(route.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(structuredData(route)).replace(/</g, '\\u003c')}</script>`,
  ]
  return tags.map(tag => tag.replace(/^<(\w+)/, '<$1 data-head')).join('\n    ')
}

function structuredData(route) {
  const org = { '@id': SITE.url + '/#organization' }
  const graph = [
    {
      '@type': 'ProfessionalService', ...org, name: SITE.name, url: SITE.url + '/',
      logo: SITE.url + '/img/creatix-logo.png', image: SITE.url + SITE.image,
      description: PAGES[0].description,
      telephone: '+91' + CONTACT.phone, email: CONTACT.email, foundingDate: '2015',
      address: { '@type': 'PostalAddress', addressLocality: 'Jaipur', addressRegion: 'Rajasthan', addressCountry: 'IN' },
      areaServed: 'IN',
      openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '19:00' }],
    },
    { '@type': 'WebSite', '@id': SITE.url + '/#website', url: SITE.url + '/', name: SITE.name, publisher: org, inLanguage: 'en-IN' },
    { '@type': 'WebPage', '@id': canonicalUrl(route), url: canonicalUrl(route), name: route.title, description: route.description, isPartOf: { '@id': SITE.url + '/#website' }, about: org },
  ]
  if (route.parent) {
    const trail = [PAGES[0], PAGES.find(r => r.path === route.parent), route]
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name ?? 'Home', item: pageUrl(r) })),
    })
  }
  if (route.service) {
    const s = SERVICES.find(x => x.id === route.service)
    graph.push({
      '@type': 'Service', name: s.title, serviceType: s.title, description: s.short, url: pageUrl(route), provider: org,
      areaServed: [{ '@type': 'City', name: 'Jaipur' }, { '@type': 'Country', name: 'India' }],
    })
  }
  if (route.section) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}
