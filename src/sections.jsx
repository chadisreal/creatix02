// Page sections. pages.jsx puts these together.
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  motion, AnimatePresence, animate, useInView, useMotionValue, useMotionValueEvent,
  useScroll, useSpring, useTransform, useVelocity,
} from 'motion/react'
import {
  ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PlusIcon, StarIcon,
} from '@phosphor-icons/react'
import { useReducedMotion } from './site-motion.jsx'
import { DisciplineStack } from './StudioSections.jsx'
import { EASE, press } from './ui.jsx'
import { Link } from './router.jsx'
import {
  ABOUT, CASES, CATEGORIES, CLIENTS, CONTACT, FAQ, IMPACT, NUMBERS, PROCESS, SERVICES,
  SERVICE_LAYOUT, TEAM, TESTIMONIALS, TIMELINE, VALUES, wa,
} from './content.js'

const reveal = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 0.8, ease: EASE } }

/* ---------- Client names: a strip that runs with your scroll ---------- */

export function Clients() {
  const reduce = useReducedMotion()
  const track = useRef(null)
  const inView = useInView(track)
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const dir = useRef(-1)
  // Runs only while the strip is on screen, so the rest of the page stays idle.
  useEffect(() => {
    if (reduce || !inView) return
    let frame = 0, last = 0
    const tick = now => {
      const dt = last ? Math.min(now - last, 64) : 0
      last = now
      const v = velocity.get()
      if (v > 5) dir.current = -1
      else if (v < -5) dir.current = 1
      const speed = 50 + Math.min(900, Math.abs(v)) * 0.35
      const half = track.current.scrollWidth / 2
      let next = x.get() + dir.current * speed * (dt / 1000)
      if (next <= -half) next += half
      if (next > 0) next -= half
      x.set(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduce, inView])
  return (
    <section className="clients" aria-label="Clients">
      <p className="clients-label">Trusted by industry leaders worldwide</p>
      <div className="clients-mask">
        <motion.ul ref={track} className="clients-track" style={{ x }}>
          {[...CLIENTS, ...CLIENTS].map((c, i) => <li key={i} aria-hidden={i >= CLIENTS.length}>{c}</li>)}
        </motion.ul>
      </div>
    </section>
  )
}

/* ---------- About: paragraph that fills in as you read, photo strip, numbers, timeline ---------- */

export function About() {
  const para = useRef(null)
  const { scrollYProgress } = useScroll({ target: para, offset: ['start 85%', 'end 45%'] })
  const words = ABOUT.split(' ')
  return (
    <section id="about" className="about">
      <div className="wrap">
        <p className="eyebrow">The studio</p>
        <h2 className="h2 studio-heading">Good ideas deserve<br /><span className="editorial-serif">extraordinary execution.</span></h2>
        <p ref={para} className="about-lead">
          {words.map((w, i) => <Word key={i} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>{w}</Word>)}
        </p>
      </div>
      <Strip />
      <div className="wrap">
        <ul className="numbers">
          {NUMBERS.map(n => (
            <motion.li key={n.label} {...reveal}>
              <strong><Count to={n.value} />{n.suffix}</strong>
              <span>{n.label}</span>
            </motion.li>
          ))}
        </ul>
        <Timeline />
      </div>
    </section>
  )
}

function Word({ p, from, to, children }) {
  const reduce = useReducedMotion()
  const opacity = useTransform(p, [from, to], [0.16, 1])
  return <><motion.span style={reduce ? undefined : { opacity }}>{children}</motion.span>{' '}</>
}

function Count({ to }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduce = useReducedMotion()
  const decimals = String(to).includes('.') ? 1 : 0
  useEffect(() => {
    if (!inView) return
    if (reduce) { ref.current.textContent = to.toFixed(decimals); return }
    const c = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: v => { if (ref.current) ref.current.textContent = v.toFixed(decimals) } })
    return () => c.stop()
  }, [inView, reduce, to, decimals])
  return <span ref={ref}>0</span>
}

const STRIP = ['/img/team-collab.jpg', '/img/web-ui.jpg', '/img/build.jpg', '/img/automate.jpg', '/img/care.jpg', '/img/circuit.jpg']

// Slides sideways with scroll and leans into fast scrolling, like a strip of film.
function Strip() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['6%', '-30%'])
  const { scrollY } = useScroll()
  const v = useSpring(useVelocity(scrollY), { stiffness: 260, damping: 40, restDelta: 1 })
  const skewX = useTransform(v, [-3000, 0, 3000], [7, 0, -7], { clamp: true })
  // The lean settles for a couple of seconds after any scroll; only draw it while the strip is on screen.
  const inView = useInView(ref, { margin: '20% 0px' })
  return (
    <div ref={ref} className="strip" aria-hidden="true">
      <motion.ul className="strip-track" style={reduce ? undefined : { x, skewX: inView ? skewX : 0 }}>
        {STRIP.map(src => <li key={src}><img src={src} alt="" loading="lazy" draggable={false} /></li>)}
      </motion.ul>
    </div>
  )
}

function Timeline() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'start 40%'] })
  return (
    <div ref={ref} className="timeline">
      <h3>Our evolution</h3>
      <div className="timeline-rail"><motion.span style={{ scaleX: reduce ? 1 : scrollYProgress }} /></div>
      <ol>
        {TIMELINE.map((t, i) => <TimelineItem key={t.year} t={t} p={scrollYProgress} last={i === TIMELINE.length - 1} />)}
      </ol>
    </div>
  )
}

function TimelineItem({ t, p, last }) {
  const reduce = useReducedMotion()
  // Light each year when the drawn line actually reaches its dot, wherever the grid put it.
  const ref = useRef(null)
  const [at, setAt] = useState(1)
  useLayoutEffect(() => {
    const li = ref.current, ol = li.parentElement
    const measure = () => setAt((li.offsetLeft + (last ? li.offsetWidth - 12 : 0)) / ol.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(ol)
    return () => ro.disconnect()
  }, [last])
  const on = useTransform(p, v => (v >= at - 0.01 ? 1 : 0))
  const lit = useSpring(on, { stiffness: 400, damping: 24 })
  const scale = useTransform(lit, [0, 1], [0.5, 1])
  const opacity = useTransform(lit, [0, 1], [0.45, 1])
  return (
    <motion.li ref={ref} style={reduce ? undefined : { opacity }}>
      <motion.i style={reduce ? undefined : { scale }} />
      <strong>{t.year}</strong>
      <span>{t.text}</span>
    </motion.li>
  )
}

/* ---------- Services: filterable bento; each card opens into its own sheet ---------- */

export function Services() {
  const [view, setView] = useState('disciplines')
  const [cat, setCat] = useState('all')
  const layout = SERVICE_LAYOUT[cat]
  const list = SERVICES.filter(s => layout[s.id])
  return (
    <section id="services" className="services wrap">
      <p className="eyebrow">Our expertise</p>
      <div className="section-head">
        <motion.h2 className="h2" {...reveal}>Many disciplines.<br /><span className="editorial-serif">One clear vision.</span></motion.h2>
        <motion.p {...reveal}>Everything your business needs to look better, work smarter, and move forward. Explore a discipline or find your next solution.</motion.p>
      </div>
      <div className="service-view" role="group" aria-label="Service display">
        <button type="button" aria-pressed={view === 'disciplines'} onClick={() => setView('disciplines')}>By discipline</button>
        <button type="button" aria-pressed={view === 'catalogue'} onClick={() => setView('catalogue')}>All services <span>{SERVICES.length}</span></button>
      </div>
      {view === 'disciplines' ? <DisciplineStack /> : <>
      <div className="tabs" role="group" aria-label="Filter services">
        {CATEGORIES.map(c => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} className={'tab' + (cat === c.id ? ' is-on' : '')} onClick={() => setCat(c.id)}>
            {cat === c.id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      <motion.ul className="bento" layout>
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map(s => <ServiceCard key={s.id} s={s} size={layout[s.id]} />)}
        </AnimatePresence>
      </motion.ul>
      </>}
    </section>
  )
}

export const catLabel = id => CATEGORIES.find(c => c.id === id)?.label

export const ServiceCard = forwardRef(function ServiceCard({ s, size }, ref) {
  return (
    <motion.li
      ref={ref}
      layout
      className={`card tone-${s.tone} size-${size}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
    >
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

/* ---------- Process: a line that draws as you read the steps ---------- */

export function Process() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] })
  return (
    <section id="process" className="process wrap">
      <div className="section-head">
        <div><p className="eyebrow">How we get there</p><motion.h2 className="h2" {...reveal}>Big thinking.<br /><span className="editorial-serif">Clear steps.</span></motion.h2><p className="process-intro">We keep the process collaborative, the decisions clear, and you in the loop.</p><span className="process-emblem" aria-hidden="true">✳</span></div>
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
  const bg = useTransform(lit, [0, 1], ['#EEF0F3', '#D22B1B'])
  const color = useTransform(lit, [0, 1], ['#0D1024', '#FFFFFF'])
  const y = useTransform(lit, [0, 1], [12, 0])
  return (
    <motion.li className="step" style={reduce ? undefined : { y }}>
      <motion.span className="step-n" style={{ backgroundColor: bg, color }}>{i + 1}</motion.span>
      <h3>{s.title}</h3>
      <p>{s.text}</p>
    </motion.li>
  )
}

/* ---------- Results: throwable rail of before/after cards ---------- */

export function Results() {
  const [after, setAfter] = useState(true)
  const viewport = useRef(null)
  const rail = useRef(null)
  const x = useMotionValue(0)
  const [bounds, setBounds] = useState({ left: 0, step: 1 })
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

  // Momentum projection: land on the card nearest to where the throw would have come to rest.
  const snap = t => Math.max(bounds.left, Math.min(0, Math.round(t / bounds.step) * bounds.step))
  // Next moves the rail left (x goes negative), previous moves it back toward 0.
  const go = dir => animate(x, snap(x.get() - dir * bounds.step), { type: 'spring', stiffness: 300, damping: 34 })

  // Dim an arrow once the rail has nowhere further to go in that direction.
  const [edge, setEdge] = useState('start')
  useMotionValueEvent(x, 'change', v => setEdge(v >= -1 ? 'start' : v <= bounds.left + 1 ? 'end' : 'middle'))
  const atStart = edge === 'start'
  const atEnd = edge === 'end' || bounds.left >= -1

  return (
    <section id="work" className="results">
      <div className="results-card">
        <div className="wrap results-head">
          <div>
            <p className="eyebrow eyebrow-light">Verified client success</p>
            <motion.h2 className="h2" {...reveal}>Measurable impact on your bottom line</motion.h2>
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
            {CASES.map(c => <CaseCard key={c.client} c={c} after={after} dragged={dragged} />)}
          </motion.ul>
        </div>
        <div className="wrap">
          <ul className="impact">
            {IMPACT.map(n => (
              <li key={n.label}>
                <strong>{n.prefix}<Count to={n.value} />{n.suffix}</strong>
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
          <p className="impact-note">Average numbers our clients see within the first 60 days.</p>
        </div>
      </div>
    </section>
  )
}

function CaseCard({ c, after, dragged }) {
  const [own, setOwn] = useState(null)
  useEffect(() => setOwn(null), [after])
  const flipped = own ?? after
  const flip = () => { if (Date.now() - dragged.current > 250) setOwn(!flipped) }
  const face = (kind, label, metric, text) => (
    <span className={'case-face case-' + kind}>
      <span className="case-top"><span className="case-tag">{c.service}</span><span>{label}</span></span>
      <span className="case-metric">{metric}</span>
      <span className="case-metric-label">{c.metric}</span>
      <span className="case-text">{text}</span>
      <span className="case-client">{c.client}<small>{c.place}</small></span>
    </span>
  )
  return (
    <li className="case">
      <button type="button" className="case-btn" onClick={flip} aria-label={`${c.client}. ${flipped ? c.after : c.before} Tap to show ${flipped ? 'before' : 'after'}.`}>
        <motion.span className="case-inner" initial={false} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
          {face('before', 'Before', c.from, c.before)}
          {face('after', 'After Creatix', c.to, c.after)}
        </motion.span>
      </button>
    </li>
  )
}

/* ---------- Team: panels that open toward your pointer ---------- */

export function Team() {
  const [open, setOpen] = useState(0)
  return (
    <section id="team" className="team wrap">
      <div className="section-head">
        <div>
          <p className="eyebrow">Meet the team</p>
          <motion.h2 className="h2" {...reveal}>The minds behind the innovation</motion.h2>
        </div>
        <ul className="values">
          {VALUES.map(v => <motion.li key={v.title} {...reveal}><strong>{v.title}</strong><span>{v.text}</span></motion.li>)}
        </ul>
      </div>
      <div className="members">
        {TEAM.map((m, i) => (
          <article key={m.name} className={'member' + (open === i ? ' is-open' : '')} onPointerEnter={() => setOpen(i)} onFocus={() => setOpen(i)} onClick={() => setOpen(i)} tabIndex={0}>
            <img src={m.img} alt={m.name} loading="lazy" draggable={false} />
            <div className="member-info">
              <h3>{m.name}</h3>
              <p className="member-role">{m.role}</p>
              <p className="member-text">{m.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- Testimonials: a deck you can throw ---------- */

export function Testimonials() {
  const [order, setOrder] = useState(TESTIMONIALS.map((_, i) => i))
  const next = () => setOrder(o => [...o.slice(1), o[0]])
  const prev = () => setOrder(o => [o[o.length - 1], ...o.slice(0, -1)])
  return (
    <section className="voices wrap" aria-label="Testimonials">
      <div className="voices-copy">
        <motion.h2 className="h2" {...reveal}>Trusted by leaders & innovators</motion.h2>
        <p>Hear from founders, directors and executives who scaled their operations with Creatix Innovation.</p>
        <div className="rating">
          <span className="stars" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <StarIcon key={i} size={18} weight="fill" />)}</span>
          <span><b>4.9 / 5</b> Google customer rating, based on 85+ client reviews</span>
        </div>
        <div className="rail-arrows">
          <motion.button type="button" className="round round-light" onClick={prev} aria-label="Previous testimonial" {...press}><ArrowLeftIcon size={18} weight="bold" /></motion.button>
          <motion.button type="button" className="round round-light" onClick={next} aria-label="Next testimonial" {...press}><ArrowRightIcon size={18} weight="bold" /></motion.button>
        </div>
      </div>
      <div className="deck">
        {order.map((idx, pos) => <Voice key={idx} t={TESTIMONIALS[idx]} pos={pos} onThrow={next} />)}
      </div>
    </section>
  )
}

function Voice({ t, pos, onThrow }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-14, 14])
  const top = pos === 0
  const end = (_, info) => {
    const far = Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 650
    if (!far) return animate(x, 0, { type: 'spring', stiffness: 420, damping: 30, velocity: info.velocity.x })
    const dir = Math.sign(info.offset.x || info.velocity.x)
    animate(x, dir * 720, { type: 'spring', stiffness: 140, damping: 22, velocity: info.velocity.x, restDelta: 20, onComplete: () => { onThrow(); x.jump(0) } })
  }
  return (
    <motion.figure
      className={'voice' + (top ? '' : ' is-back')}
      style={{ x, rotate, zIndex: 10 - pos }}
      initial={false}
      animate={{ scale: 1 - pos * 0.06, y: pos * 22, opacity: 1 - pos * 0.18 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={top ? 'x' : false}
      onDragEnd={end}
      aria-hidden={!top}
    >
      <blockquote>“{t.quote}”</blockquote>
      <figcaption>
        <img src={t.img} alt="" draggable={false} />
        <span><b>{t.name}</b>{t.role}</span>
      </figcaption>
    </motion.figure>
  )
}

/* ---------- FAQ ---------- */

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="faq wrap" aria-labelledby="faq-title">
      <div><p className="eyebrow">A few good questions</p><motion.h2 id="faq-title" className="h2" {...reveal}>Before we<br /><span className="editorial-serif">begin.</span></motion.h2></div>
      <ul className="faq-list">
        {FAQ.map((f, i) => (
          <li key={f.q} className={open === i ? 'is-open' : ''}>
            <button type="button" aria-expanded={open === i} aria-controls={'faq-' + i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span>
              <motion.span className="faq-icon" animate={{ rotate: open === i ? 45 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}><PlusIcon size={18} weight="bold" /></motion.span>
            </button>
            <div id={'faq-' + i} className="faq-a" role="region"><div><p>{f.a}</p></div></div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Contact: three panes of frosted glass ---------- */

// A pane of frosted glass: the pointer tilts it and moves the sheen.
function Tile({ on = false, onPick, index, as = 'button', href, children }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 260, damping: 22 }), sry = useSpring(ry, { stiffness: 260, damping: 22 })
  const onMove = e => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    ry.set((x - 0.5) * 12); rx.set((0.5 - y) * 12)
    ref.current.style.setProperty('--gx', x * 100 + '%')
    ref.current.style.setProperty('--gy', y * 100 + '%')
  }
  const onLeave = () => { rx.set(0); ry.set(0) }
  const Comp = as === 'a' ? motion.a : motion.button
  return (
    <Comp
      ref={ref}
      {...(as === 'a' ? { href, target: href?.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : { type: 'button' })}
      className={`tile tile-${index}${on ? ' is-on' : ''}`}
      onClick={onPick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={reduce ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 600, damping: 32 }}
    >
      {children}
    </Comp>
  )
}

export function Contact({ onTalk }) {
  return (
    <section id="contact" className="contact">
      <div className="contact-card">
        <img className="contact-photo" src="/img/team-collab.jpg" alt="" loading="lazy" />
        <div className="contact-scrim" />
        <div className="contact-copy">
          <motion.h2 className="h2" {...reveal}>A conversation.<br /><span className="editorial-serif">A new possibility.</span></motion.h2>
          <p>Talk to Creatix Innovation about your next project, website overhaul or business automation system.</p>
          <ul className="contact-meta">
            <li><MapPinIcon size={18} weight="bold" />{CONTACT.location}</li>
            <li><ClockIcon size={18} weight="bold" />{CONTACT.hours}</li>
            <li><EnvelopeSimpleIcon size={18} weight="bold" /><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
          </ul>
        </div>
        <div className="tiles contact-tiles">
          <Tile index={0} on onPick={onTalk}>
            <span className="tile-word">Let's Talk</span>
            <span className="tile-label">Book a free live demo</span>
          </Tile>
          <Tile index={1} as="a" href={CONTACT.phoneHref}>
            <span className="tile-word">Call</span>
            <span className="tile-label">{CONTACT.phone}</span>
          </Tile>
          <Tile index={2} as="a" href={wa('Hi Creatix, I would like a free consultation.')}>
            <span className="tile-word">Chat</span>
            <span className="tile-label">On WhatsApp</span>
          </Tile>
        </div>
      </div>
    </section>
  )
}
