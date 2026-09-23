// Page sections. pages.jsx puts these together.
//
// Everything visual composes from the primitives in ui.jsx: Display for masked two-tone
// headings, MicroLabel for the mono labels, Marquee for the running bands, Frame for
// imagery, Counter for figures. Decorative loops and hovers are CSS, not motion
// components, so `.motion-paused *` switches them all off in one rule.
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  motion, animate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform,
} from 'motion/react'
import {
  ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PlusIcon,
} from '@phosphor-icons/react'
import { useReducedMotion } from './site-motion.jsx'
import { DISCIPLINES } from './StudioSections.jsx'
import { Counter, Display, Frame, Marquee, MicroLabel, TOKEN, press, reveal, stagger } from './ui.jsx'
import { Link } from './router.jsx'
import {
  ABOUT, CASES, CATEGORIES, CLIENTS, CONTACT, FAQ, IMPACT, NUMBERS, PROCESS, SERVICES,
  TEAM, TESTIMONIALS, VALUES, wa,
} from './content.js'

const pad = n => String(n).padStart(2, '0')

/* ---------- Clients: a band of names running past ---------- */

export function Clients() {
  return (
    <section className="clients" aria-label="Clients">
      <MicroLabel className="clients-label" dot={false}>Trusted by industry leaders</MicroLabel>
      <Marquee speed={38} label={'Clients: ' + CLIENTS.join(', ')}>
        <ul className="clients-track">
          {CLIENTS.map(c => <li key={c}>{c}<i aria-hidden="true" /></li>)}
        </ul>
      </Marquee>
    </section>
  )
}

/* ---------- About: a paragraph that fills in as you read it ---------- */

export function About() {
  const para = useRef(null)
  const { scrollYProgress } = useScroll({ target: para, offset: ['start 85%', 'end 45%'] })
  const words = ABOUT.split(' ')
  return (
    <section id="about" className="about wash">
      <div className="wrap about-head">
        <div>
          <MicroLabel>The studio</MicroLabel>
          <Display className="studio-heading" lines={['Good ideas deserve', 'extraordinary execution.']} />
        </div>
        <p ref={para} className="about-lead">
          {words.map((w, i) => (
            <Word key={i} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>{w}</Word>
          ))}
        </p>
      </div>

      <div className="wrap about-body">
        <Frame className="about-photo" src="/img/team-collab.jpg" alt="The Creatix Innovation team at work" glow ratio="4 / 3" />
        <ul className="numbers">
          {NUMBERS.map((n, i) => (
            <motion.li key={n.label} {...stagger(i)}>
              <strong><Counter to={n.value} suffix={n.suffix} /></strong>
              <MicroLabel as="span" dot={false}>{n.label}</MicroLabel>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// Each word lifts from near-invisible to full as the paragraph passes the reading line.
function Word({ p, from, to, children }) {
  const reduce = useReducedMotion()
  const opacity = useTransform(p, [from, to], [0.16, 1])
  return <><motion.span style={reduce ? undefined : { opacity }}>{children}</motion.span>{' '}</>
}

/* ---------- Services: the four disciplines as numbered rows ---------- */

export function Services() {
  return (
    <section id="services" className="services wrap">
      <MicroLabel>Our expertise</MicroLabel>
      <div className="section-head">
        <Display lines={['Many disciplines.', 'One clear vision.']} />
        <motion.p {...reveal}>Everything your business needs to look better, work smarter, and move forward. Every service we offer sits under one of these four.</motion.p>
      </div>
      <ol className="disciplines">
        {DISCIPLINES.map((d, i) => (
          <motion.li key={d.title} className="discipline-row" {...stagger(i)}>
            <span className="discipline-index" aria-hidden="true">[{pad(i + 1)}]</span>
            <span className="discipline-rule" aria-hidden="true" />
            <h3>{d.title.replace(/\.$/, '')}</h3>
            <div className="discipline-detail">
              <MicroLabel as="p" dot={false} className="discipline-label">{d.label}</MicroLabel>
              <p>{d.text}</p>
              <ul className="discipline-services">
                {d.ids.map(id => {
                  const s = SERVICES.find(x => x.id === id)
                  return <li key={id}><Link to={'/' + s.slug}>{s.title}<ArrowUpRightIcon size={13} weight="bold" /></Link></li>
                })}
              </ul>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}

export const catLabel = id => CATEGORIES.find(c => c.id === id)?.label

// Still used by the service pages for their related-services grid.
export const ServiceCard = forwardRef(function ServiceCard({ s, size }, ref) {
  return (
    <motion.li ref={ref} className={`card tone-${s.tone} size-${size}`} {...reveal}>
      <Link to={'/' + s.slug} className="card-btn">
        {s.img && <img className="card-img" src={s.img} alt="" loading="lazy" draggable={false} />}
        <span className="card-cat">{catLabel(s.cat)}</span>
        <span className="card-body">
          <span className="card-title">{s.title}</span>
          <span className="card-text">{s.short}</span>
        </span>
        <span className="card-go"><ArrowUpRightIcon size={18} weight="bold" /></span>
      </Link>
    </motion.li>
  )
})

/* ---------- Process: numbered steps that light as you read down them ---------- */

export function Process() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] })
  return (
    <section id="process" className="process wrap wash">
      <div className="process-head">
        <MicroLabel>How we get there</MicroLabel>
        <Display lines={['Big thinking.', 'Clear steps.']} />
        <p className="process-intro">We keep the process collaborative, the decisions clear, and you in the loop.</p>
      </div>
      <ol ref={ref} className="steps">
        {PROCESS.map((s, i) => <Step key={s.title} s={s} i={i} p={scrollYProgress} />)}
      </ol>
    </section>
  )
}

function Step({ s, i, p }) {
  const reduce = useReducedMotion()
  const on = useTransform(p, v => (v >= i / (PROCESS.length - 1) - 0.04 ? 1 : 0))
  const lit = useSpring(on, { stiffness: 300, damping: 30 })
  // Near-black on the accent, never white: #fff on #34bb7b is 2.46:1.
  const bg = useTransform(lit, [0, 1], [TOKEN.surface, TOKEN.accent])
  const color = useTransform(lit, [0, 1], [TOKEN.muted, TOKEN.bg])
  const rule = useTransform(lit, [0, 1], [0.12, 1])
  return (
    <motion.li className="step" {...stagger(i)}>
      <motion.span className="step-n" style={reduce ? undefined : { backgroundColor: bg, color }}>{pad(i + 1)}</motion.span>
      <motion.span className="step-rule" aria-hidden="true" style={reduce ? undefined : { scaleX: rule }} />
      <h3>{s.title}</h3>
      <p>{s.text}</p>
    </motion.li>
  )
}

/* ---------- Work: a rail of client outcomes you can throw ---------- */

export function Results() {
  const [after, setAfter] = useState(true)
  const viewport = useRef(null)
  const rail = useRef(null)
  const x = useMotionValue(0)
  const [bounds, setBounds] = useState({ left: 0, step: 1 })
  const [active, setActive] = useState(0)
  const dragged = useRef(0)

  useLayoutEffect(() => {
    const measure = () => {
      const [a, b] = rail.current.children
      setBounds({ left: Math.min(0, viewport.current.clientWidth - rail.current.scrollWidth), step: b ? b.offsetLeft - a.offsetLeft : 1 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewport.current)
    return () => ro.disconnect()
  }, [])

  // Momentum projection: land on the card nearest where the throw would have come to rest.
  const snap = t => Math.max(bounds.left, Math.min(0, Math.round(t / bounds.step) * bounds.step))
  const go = dir => animate(x, snap(x.get() - dir * bounds.step), { type: 'spring', stiffness: 300, damping: 34 })

  const [edge, setEdge] = useState('start')
  useMotionValueEvent(x, 'change', v => {
    setEdge(v >= -1 ? 'start' : v <= bounds.left + 1 ? 'end' : 'middle')
    setActive(Math.min(CASES.length - 1, Math.max(0, Math.round(-v / bounds.step))))
  })
  const atStart = edge === 'start'
  const atEnd = edge === 'end' || bounds.left >= -1

  return (
    <section id="work" className="results wash">
      <div className="results-card">
        <div className="wrap results-head">
          <div>
            <MicroLabel light>Verified client success</MicroLabel>
            <Display lines={['Measurable impact', 'on your bottom line']} />
          </div>
          <div className="results-controls">
            <div className="segment" role="radiogroup" aria-label="Show results">
              {[['Before', false], ['After Creatix', true]].map(([label, val]) => (
                <button key={label} type="button" role="radio" aria-checked={after === val} className={after === val ? 'is-on' : ''} onClick={() => setAfter(val)}>
                  {after === val && <motion.span layoutId="seg-pill" className="segment-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="rail-arrows">
              <span className="rail-count" aria-live="polite">{pad(active + 1)} <i aria-hidden="true">/</i> {pad(CASES.length)}</span>
              <motion.button type="button" className="round" onClick={() => go(-1)} disabled={atStart} aria-label="Previous case" {...press}><ArrowLeftIcon size={18} weight="bold" /></motion.button>
              <motion.button type="button" className="round" onClick={() => go(1)} disabled={atEnd} aria-label="Next case" {...press}><ArrowRightIcon size={18} weight="bold" /></motion.button>
            </div>
          </div>
        </div>
        <div ref={viewport} className="rail-viewport">
          <motion.ul
            ref={rail}
            className="rail"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: bounds.left, right: 0 }}
            dragElastic={0.14}
            dragTransition={{ power: 0.35, timeConstant: 260, modifyTarget: snap, bounceStiffness: 300, bounceDamping: 32 }}
            onDragStart={() => { dragged.current = Date.now() }}
            onDragEnd={() => { dragged.current = Date.now() }}
          >
            {CASES.map((c, i) => <CaseCard key={c.client} c={c} i={i} after={after} dragged={dragged} />)}
          </motion.ul>
        </div>
        <div className="wrap">
          <ul className="impact">
            {IMPACT.map((n, i) => (
              <motion.li key={n.label} {...stagger(i)}>
                <strong>{n.prefix}<Counter to={n.value} suffix={n.suffix} /></strong>
                <MicroLabel as="span" dot={false}>{n.label}</MicroLabel>
              </motion.li>
            ))}
          </ul>
          <p className="impact-note">Average numbers our clients see within the first 60 days.</p>
        </div>
      </div>
    </section>
  )
}

// Before and after cross-fade in place. The old version span-flipped the card in 3D, which
// read as a widget rather than an editorial page.
function CaseCard({ c, i, after, dragged }) {
  const [own, setOwn] = useState(null)
  useEffect(() => setOwn(null), [after])
  const shown = own ?? after
  const toggle = () => { if (Date.now() - dragged.current > 250) setOwn(!shown) }
  return (
    <li className="case">
      <button type="button" className="case-btn" onClick={toggle} aria-label={`${c.client}. ${shown ? c.after : c.before} Activate to show ${shown ? 'before' : 'after'}.`}>
        <span className="case-top">
          <span className="case-index" aria-hidden="true">[{pad(i + 1)}]</span>
          <span className={'case-tag' + (shown ? ' is-after' : '')}>{shown ? 'After Creatix' : 'Before'}</span>
        </span>
        <motion.span key={String(shown)} className="case-face" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <span className="case-metric">{shown ? c.to : c.from}</span>
          <MicroLabel as="span" dot={false} className="case-metric-label">{c.metric}</MicroLabel>
          <span className="case-text">{shown ? c.after : c.before}</span>
        </motion.span>
        <span className="case-client">{c.client}<small>{c.service} · {c.place}</small></span>
      </button>
    </li>
  )
}

/* ---------- Team ---------- */

export function Team() {
  return (
    <section id="team" className="team wrap">
      <div className="section-head">
        <div>
          <MicroLabel>Meet the team</MicroLabel>
          <Display lines={['The minds behind', 'the innovation']} />
        </div>
        <ul className="values">
          {VALUES.map((v, i) => (
            <motion.li key={v.title} {...stagger(i)}>
              <strong>{v.title}</strong>
              <span>{v.text}</span>
            </motion.li>
          ))}
        </ul>
      </div>
      <ul className="members">
        {TEAM.map((m, i) => (
          <li key={m.name}>
            <Frame className="member-photo" src={m.img} alt={m.name} ratio="4 / 5" />
            <span className="member-index" aria-hidden="true">[{pad(i + 1)}]</span>
            <h3>{m.name}</h3>
            <MicroLabel as="p" dot={false} className="member-role">{m.role}</MicroLabel>
            <p className="member-text">{m.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Testimonials: one large quote at a time ---------- */

export function Testimonials() {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  const t = TESTIMONIALS[i]
  const move = step => setI(v => (v + step + TESTIMONIALS.length) % TESTIMONIALS.length)
  return (
    <section className="voices wash" aria-label="Testimonials">
      <div className="wrap voices-inner">
        <div className="voices-head">
          <MicroLabel>In their words</MicroLabel>
          <div className="rail-arrows">
            <span className="rail-count" aria-live="polite">{pad(i + 1)} <i aria-hidden="true">/</i> {pad(TESTIMONIALS.length)}</span>
            <motion.button type="button" className="round round-light" onClick={() => move(-1)} aria-label="Previous testimonial" {...press}><ArrowLeftIcon size={18} weight="bold" /></motion.button>
            <motion.button type="button" className="round round-light" onClick={() => move(1)} aria-label="Next testimonial" {...press}><ArrowRightIcon size={18} weight="bold" /></motion.button>
          </div>
        </div>
        <motion.figure
          key={i}
          className="voice"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <blockquote className="quote-serif">{t.quote}</blockquote>
          <figcaption>
            <span className="voice-name">{t.name}</span>
            <MicroLabel as="span" dot={false}>{t.role}</MicroLabel>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="faq wrap" aria-labelledby="faq-title">
      <div className="faq-head">
        <MicroLabel>A few good questions</MicroLabel>
        <Display id="faq-title" lines={['Before', 'we begin.']} />
      </div>
      <ul className="faq-list">
        {FAQ.map((f, i) => (
          <li key={f.q} className={open === i ? 'is-open' : ''}>
            <button type="button" aria-expanded={open === i} aria-controls={'faq-' + i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="faq-index" aria-hidden="true">[{pad(i + 1)}]</span>
              <span className="faq-q">{f.q}</span>
              <motion.span className="faq-icon" animate={{ rotate: open === i ? 45 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <PlusIcon size={18} weight="bold" />
              </motion.span>
            </button>
            <div id={'faq-' + i} className="faq-a" role="region"><div><p>{f.a}</p></div></div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Contact ---------- */

export function Contact({ onTalk }) {
  return (
    <section id="contact" className="contact">
      <div className="contact-card">
        <img className="contact-photo" src="/img/team-collab.jpg" alt="" loading="lazy" />
        <div className="contact-scrim" />
        <div className="wrap contact-inner">
          <div className="contact-copy">
            <MicroLabel light>Start here</MicroLabel>
            <Display lines={['A conversation.', 'A new possibility.']} />
            <p>Talk to Creatix Innovation about your next project, website overhaul or business automation system.</p>
            <ul className="contact-meta">
              <li><MapPinIcon size={17} weight="bold" />{CONTACT.location}</li>
              <li><ClockIcon size={17} weight="bold" />{CONTACT.hours}</li>
              <li><EnvelopeSimpleIcon size={17} weight="bold" /><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
            </ul>
          </div>
          <div className="contact-tiles">
            <motion.button type="button" className="tile glass tile-lead" onClick={onTalk} {...press}>
              <span className="tile-word">Let's Talk</span>
              <MicroLabel as="span" dot={false} className="tile-label">Book a free live demo</MicroLabel>
              <ArrowUpRightIcon className="tile-go" size={18} weight="bold" />
            </motion.button>
            <motion.a className="tile glass" href={CONTACT.phoneHref} {...press}>
              <span className="tile-word">Call</span>
              <MicroLabel as="span" dot={false} className="tile-label">{CONTACT.phone}</MicroLabel>
            </motion.a>
            <motion.a className="tile glass" href={wa('Hi Creatix, I would like a free consultation.')} target="_blank" rel="noreferrer" {...press}>
              <span className="tile-word">Chat</span>
              <MicroLabel as="span" dot={false} className="tile-label">On WhatsApp</MicroLabel>
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
