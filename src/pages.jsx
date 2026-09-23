// The screens: the one-page site, a full page per service (for visitors arriving from search), and 404.
import { memo } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRightIcon, CheckIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import Hero from './Hero.jsx'
import { DISCIPLINES, ManifestoStrip } from './StudioSections.jsx'
import { About, Clients, Contact, Faq, Process, Results, ServiceCard, Services, Team, Testimonials, catLabel } from './sections.jsx'
import { SERVICES, wa } from './content.js'
import { PAGES } from './routes.js'
import { Link } from './router.jsx'
import { MotionLink, SiteNav, press } from './ui.jsx'

export const Page = memo(function Page({ route, ui }) {
  switch (route.page) {
    case 'home': return <OnePage ui={ui} />
    case 'service': return <ServicePage route={route} ui={ui} />
    default: return <NotFoundPage route={route} ui={ui} />
  }
})

function OnePage({ ui }) {
  return <>
    <Hero onTalk={ui.onTalk} onMenu={ui.onMenu} />
    <ManifestoStrip />
    <About />
    <Clients />
    <Services />
    <Process />
    <Results />
    <Team />
    <Testimonials />
    <Faq />
    <Contact onTalk={ui.onTalk} />
  </>
}

function ServicePage({ route, ui }) {
  const s = SERVICES.find(x => x.id === route.service)
  const discipline = DISCIPLINES.find(d => d.ids.includes(s.id))
  const related = discipline.ids.filter(id => id !== s.id).slice(0, 4).map(id => SERVICES.find(x => x.id === id))
  // Card widths that always fill the row of four.
  const sizes = { 1: ['full'], 2: ['w', 'w'], 3: ['w', 's', 's'], 4: ['s', 's', 's', 's'] }[related.length]
  return <>
    <PageHero route={route} ui={ui} eyebrow={catLabel(s.cat)} title={s.title} text={s.short}>
      <div className="hero-cta">
        <motion.button type="button" className="pill pill-red pill-lg" onClick={e => ui.onTalk(e, s.title)} {...press}>Book a free live demo<ArrowUpRightIcon size={18} weight="bold" /></motion.button>
        <a className="pill pill-glass pill-lg" href={wa(`Hi Creatix, I want details about ${s.title}.`)} target="_blank" rel="noreferrer"><WhatsappLogoIcon size={20} weight="fill" />WhatsApp us</a>
      </div>
    </PageHero>

    <section className="service-detail wrap" aria-labelledby="service-points">
      <div className="service-detail-head">
        <p className="eyebrow">{discipline.label}</p>
        <h2 id="service-points" className="h2">What you <span className="liquid-glass">get.</span></h2>
        <p>{discipline.text}</p>
      </div>
      <div>
        <ul className="service-points">
          {s.points.map((point, i) => (
            <motion.li key={point} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.6, delay: i * 0.04 }}>
              <CheckIcon size={20} weight="bold" /><span>{point}</span>
            </motion.li>
          ))}
        </ul>
        {s.industries && <>
          <h3 className="service-built">Built for</h3>
          <ul className="chips">{s.industries.map(x => <li key={x}>{x}</li>)}</ul>
        </>}
      </div>
    </section>

    {related.length > 0 && (
      <section className="related wrap" aria-labelledby="related-title">
        <div className="section-head">
          <div><p className="eyebrow">More in {discipline.title.replace(/\.$/, '')}</p><h2 id="related-title" className="h2">Works well <span className="liquid-glass">together.</span></h2></div>
          <p>Most projects combine more than one discipline. <Link to="/services">See every service</Link>.</p>
        </div>
        <ul className="bento related-bento">
          {related.map((r, i) => <ServiceCard key={r.id} s={r} size={sizes[i]} />)}
        </ul>
      </section>
    )}
    <Process />
    <Contact onTalk={ui.onTalk} />
  </>
}

function NotFoundPage({ route, ui }) {
  return (
    <PageHero route={route} ui={ui} eyebrow="Error 404" title="This page has" serif="moved on."
      text="The page you were looking for isn't here. Everything else is just a click away.">
      <div className="hero-cta">
        <MotionLink className="pill pill-red pill-lg" to="/" {...press}>Back to home<ArrowUpRightIcon size={18} weight="bold" /></MotionLink>
        <Link className="pill pill-glass pill-lg" to="/services">Explore our expertise</Link>
      </div>
    </PageHero>
  )
}

function PageHero({ route, ui, eyebrow, title, serif, text, children }) {
  const parent = route.parent && PAGES.find(r => r.path === route.parent)
  return (
    <section className="page-hero">
      <div className="page-hero-card">
        <img className="page-hero-img" src={route.hero} alt="" fetchPriority="high" draggable={false} />
        <SiteNav onTalk={ui.onTalk} onMenu={ui.onMenu} />
        <div className="page-hero-copy">
          {route.name && (
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li><Link to="/">Home</Link></li>
                {parent && <li><Link to={parent.path}>{parent.name}</Link></li>}
                <li aria-current="page">{route.name}</li>
              </ol>
            </nav>
          )}
          <p className="hero-kicker">{eyebrow}</p>
          <h1 className="page-title">{title}{serif && <>{' '}<br /><span className="liquid-glass">{serif}</span></>}</h1>
          {text && <p className="page-lead">{text}</p>}
          {children}
        </div>
      </div>
    </section>
  )
}
