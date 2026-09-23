import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'motion/react'
import { CheckCircleIcon, CheckIcon, ListIcon, PaperPlaneTiltIcon, PhoneIcon, WhatsappLogoIcon, XIcon } from '@phosphor-icons/react'
import { MotionToggle, ReadingProgress } from './StudioSections.jsx'
import { Page } from './pages.jsx'
import { PAGES, findRoute, headTags } from './routes.js'
import { Link, Router, screenOf, useRouter } from './router.jsx'
import { Brand, LineMask, Marquee, MicroLabel, NAV, press, useNavCurrent } from './ui.jsx'
import { useLenis } from './site-motion.jsx'
import { CONTACT, INQUIRY_SERVICES, SERVICES, wa } from './content.js'
import { catLabel } from './sections.jsx'

// Lock page scroll while a sheet is open, close on Escape, and give focus back to whatever opened it.
function useSheet(onClose) {
  const layerRef = useRef(null)
  const lenisRef = useLenis()
  useEffect(() => {
    const back = document.activeElement
    const key = e => {
      const layer = layerRef.current
      if ([...document.querySelectorAll('.sheet-layer')].at(-1) !== layer) return
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      const items = [...(layer?.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]') || [])].filter(el => !el.disabled && el.getClientRects().length)
      const first = items[0], last = items[items.length - 1]
      if (!first) return
      if (e.shiftKey && (document.activeElement === first || !layer.contains(document.activeElement))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || !layer.contains(document.activeElement))) { e.preventDefault(); first.focus() }
    }
    document.documentElement.classList.add('is-locked')
    // html { overflow: hidden } does not reach Lenis: it would keep consuming wheel events
    // and the page would jump to the accumulated position when the sheet closed.
    lenisRef?.current?.stop()
    addEventListener('keydown', key)
    return () => {
      removeEventListener('keydown', key)
      requestAnimationFrame(() => {
        const remaining = [...document.querySelectorAll('.sheet-layer')].at(-1)
        if (remaining) {
          if (!remaining.contains(document.activeElement)) remaining.querySelector('button, a[href], input')?.focus({ preventScroll: true })
        } else {
          document.documentElement.classList.remove('is-locked')
          lenisRef?.current?.start()
          if (back?.isConnected) back.focus?.({ preventScroll: true })
        }
      })
    }
  }, [])
  return layerRef
}

export default function App({ url }) {
  return <Router url={url}><Site /></Router>
}

function Site() {
  const { path, bg, closeSheet } = useRouter()
  const route = findRoute(path)
  // The screen stays put while the address moves between sections or a service sheet opens over it.
  const screen = screenOf(bg ?? path)
  const sheet = bg && route.page === 'service' ? route : null
  const [talk, setTalk] = useState(null) // { x, y, service }
  const [menu, setMenu] = useState(false)
  const [moved, setMoved] = useState(false)
  const shownScreen = useRef(screen)
  const ui = useMemo(() => ({
    onTalk: (e, svc) => {
      const r = e?.currentTarget?.getBoundingClientRect?.()
      setTalk({ x: r ? r.left + r.width / 2 : innerWidth / 2, y: r ? r.top + r.height / 2 : innerHeight / 2, service: svc })
    },
    onMenu: () => setMenu(true),
  }), [])

  // Keep the title, description, canonical link and structured data in step with the address.
  useEffect(() => {
    document.head.querySelectorAll('[data-head]').forEach(el => el.remove())
    document.head.insertAdjacentHTML('beforeend', headTags(route))
  }, [route])

  useEffect(() => {
    if (shownScreen.current === screen) return
    shownScreen.current = screen
    setMoved(true)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [screen])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <ReadingProgress />
      <FloatingNav onTalk={ui.onTalk} onMenu={ui.onMenu} />
      <main id="main" tabIndex={-1} key={screen} className={moved ? 'page-in' : undefined}>
        <Page route={screen === '/' ? PAGES[0] : findRoute(screen)} ui={ui} />
      </main>
      <Footer />

      <AnimatePresence>
        {sheet && <ServiceSheet key={sheet.path} id={sheet.service} onClose={closeSheet} onTalk={(e, title) => { closeSheet(); ui.onTalk(e, title) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {talk && <TalkSheet key="talk" origin={talk} onClose={() => setTalk(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {menu && <MenuSheet key="menu" onClose={() => setMenu(false)} onTalk={e => { setMenu(false); ui.onTalk(e) }} />}
      </AnimatePresence>
    </>
  )
}

/* ---------- Floating capsule nav: materialises once the page's hero is behind you ---------- */

function FloatingNav({ onTalk, onMenu }) {
  const { scrollY } = useScroll()
  const [shown, setShown] = useState(false)
  const isCurrent = useNavCurrent()
  useMotionValueEvent(scrollY, 'change', y => {
    const hero = document.querySelector('main > :first-child')
    setShown(y > (hero?.offsetHeight ?? innerHeight) * 0.85)
  })

  return (
    <AnimatePresence>
      {shown && (
        <motion.header className="float-nav"
          initial={{ y: -24, opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: -24, opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
          <Brand />
          <nav className="float-links" aria-label="Main">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} className={isCurrent(n.to) ? 'is-on' : ''} aria-current={isCurrent(n.to) ? 'page' : undefined}>
                {isCurrent(n.to) && <motion.span layoutId="float-pill" className="float-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <motion.button type="button" className="pill pill-red" onClick={onTalk} {...press}>Let's Talk</motion.button>
          <button type="button" className="pill pill-quiet icon-only show-sm" onClick={onMenu} aria-label="Open menu"><ListIcon size={20} weight="bold" /></button>
        </motion.header>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  const picks = ['web', 'app', 'crm', 'erp', 'pos', 'marketing'].map(id => SERVICES.find(x => x.id === id))
  const lenisRef = useLenis()
  const toTop = () => {
    const lenis = lenisRef?.current
    if (lenis) lenis.scrollTo(0, { duration: 1 })
    else scrollTo({ top: 0, behavior: 'smooth' })
  }
  const cols = [
    ['Services', [...picks.map(s => [s.title, '/' + s.slug]), ['All services', '/services']]],
    ['Company', [['Home', '/'], ...NAV.map(n => [n.label, n.to])]],
  ]
  return (
    <footer className="footer">
      {/* The statement the cut GlassStory section carried, which was worth keeping. */}
      <div className="wrap footer-statement">
        <p className="quote-serif">Design and engineering, in the same room.</p>
      </div>

      <div className="wrap footer-cols">
        <div className="footer-brand">
          <img src="/img/creatix-logo.png" alt="Creatix Innovation" width="92" height="88" loading="lazy" />
          <p>Powering Digital Excellence. Your partner in digital transformation and innovation.</p>
        </div>
        {cols.map(([title, items]) => (
          <nav key={title} aria-label={title}>
            <MicroLabel as="h3" dot={false}>{title}</MicroLabel>
            <ul>{items.map(([label, to]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
          </nav>
        ))}
        <div>
          <MicroLabel as="h3" dot={false}>Contact</MicroLabel>
          <ul>
            <li><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
            <li><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
            <li>{CONTACT.location}</li>
            <li>{CONTACT.hours}</li>
          </ul>
        </div>
      </div>

      {/* The wordmark at display scale, running past. Sign-off rather than navigation. */}
      <Marquee className="footer-mark" speed={26} label="Creatix Innovation">
        <span className="display display-xl liquid-glass">Creatix Innovation&nbsp;·&nbsp;</span>
      </Marquee>

      <div className="wrap footer-legal">
        <span suppressHydrationWarning>© {new Date().getFullYear()} Creatix Innovation. All rights reserved.</span>
        <button type="button" className="to-top" onClick={toTop}>Back to top ↑</button>
        <MotionToggle />
      </div>
    </footer>
  )
}

/* ---------- Sheets ---------- */

// A service, opened from the one-page site. Its address is the service's own page.
function ServiceSheet({ id, onClose, onTalk }) {
  const s = SERVICES.find(x => x.id === id)
  const close = useRef(null)
  const layerRef = useSheet(onClose)
  useEffect(() => { close.current?.focus({ preventScroll: true }) }, [])
  return (
    <div ref={layerRef} className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby="svc-title">
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className={`sheet sheet-svc tone-${s.tone}`} initial={{ opacity: 0, y: 48, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 48, scale: 0.96 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
        <div className="sheet-body">
          <button ref={close} type="button" className="sheet-close" onClick={onClose} aria-label="Close"><XIcon size={20} weight="bold" /></button>
          <span className="card-cat">{catLabel(s.cat)}</span>
          <h2 id="svc-title" className="sheet-title">{s.title}</h2>
          <p className="sheet-text">{s.short}</p>
          <h3 className="sheet-h">What you get</h3>
          <ul className="checks">
            {s.points.map((pt, i) => (
              <motion.li key={pt} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.12 + i * 0.04 } }}>
                <CheckIcon size={16} weight="bold" />{pt}
              </motion.li>
            ))}
          </ul>
          {s.industries && <>
            <h3 className="sheet-h">Built for</h3>
            <ul className="chips">{s.industries.map(x => <li key={x}>{x}</li>)}</ul>
          </>}
          <div className="sheet-actions">
            <motion.button type="button" className="pill pill-red pill-lg" onClick={e => onTalk(e, s.title)} {...press}>Book a free live demo</motion.button>
            <motion.a className="pill pill-outline pill-lg" href={wa(`Hi Creatix, I want details about ${s.title}.`)} target="_blank" rel="noreferrer" {...press}>
              <WhatsappLogoIcon size={20} weight="fill" />WhatsApp
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Grows out of the button that opened it and shrinks back into it.
function TalkSheet({ origin, onClose }) {
  const layerRef = useSheet(onClose)
  const first = useRef(null)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  useEffect(() => { first.current?.focus({ preventScroll: true }) }, [])
  const from = { opacity: 0, scale: 0.3, x: origin.x - innerWidth / 2, y: origin.y - innerHeight / 2 }
  const preset = !origin.service ? INQUIRY_SERVICES[0] : INQUIRY_SERVICES.includes(origin.service) ? origin.service : 'Other Consultation'

  const submit = async e => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    let digits = String(f.phone).replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
    const next = {}
    if (!String(f.name).trim()) next.name = 'Please add your name.'
    if (!/^[6-9]\d{9}$/.test(digits)) next.phone = 'Enter a 10 digit mobile number.'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) next.email = 'This email looks incomplete.'
    setErrors(next)
    if (Object.keys(next).length) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(f.name).trim(),
          phone: digits,
          email: f.email || undefined,
          business: f.business || undefined,
          service: f.service,
          originService: origin.service,
          message: f.message || undefined,
          company: f.company || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('send-lead fetch failed', err)
      setStatus('error')
    }
  }
  const err = k => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? k + '-err' : undefined })

  return (
    <div ref={layerRef} className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby="talk-title">
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="sheet talk" initial={from} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} exit={from} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close"><XIcon size={20} weight="bold" /></button>
        <h2 id="talk-title" className="sheet-title">Let's talk</h2>
        <p className="sheet-text">Share a few details and our senior expert will get back to you. Prefer a call? <a href={CONTACT.phoneHref}>{CONTACT.phone}</a></p>
        {status === 'sent' ? (
          <motion.div className="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="sent-icon"><CheckCircleIcon size={28} weight="fill" /></span>
            <p>Thanks — your message is on its way to our team. We'll get back to you shortly.</p>
            <button type="button" className="pill pill-outline" onClick={onClose}>Done</button>
          </motion.div>
        ) : (
          <form className="form" noValidate method="post" onSubmit={submit}>
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />
            <Field id="name" label="Full name *" error={errors.name}><input ref={first} id="name" name="name" autoComplete="name" {...err('name')} /></Field>
            <Field id="phone" label="Phone / WhatsApp *" error={errors.phone}><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" {...err('phone')} /></Field>
            <Field id="email" label="Email address" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" {...err('email')} /></Field>
            <Field id="business" label="Business name"><input id="business" name="business" autoComplete="organization" /></Field>
            <Field id="service" label="Service required" wide>
              <select id="service" name="service" defaultValue={preset}>{INQUIRY_SERVICES.map(o => <option key={o}>{o}</option>)}</select>
            </Field>
            <Field id="message" label="Project requirements" wide><textarea id="message" name="message" rows={3} /></Field>
            {status === 'error' && <motion.p className="field-err" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>Something went wrong sending your message. Please try again, or call/WhatsApp us at <a href={CONTACT.phoneHref} style={{ color: 'inherit', fontWeight: 500 }}>{CONTACT.phone}</a> instead.</motion.p>}
            <motion.button type="submit" className="pill pill-red pill-lg form-submit" disabled={status === 'submitting'} {...press}>{status === 'submitting' ? 'Sending…' : 'Send'}<PaperPlaneTiltIcon size={20} weight="fill" /></motion.button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

function Field({ id, label, error, wide, children }) {
  return (
    <div className={'field' + (wide ? ' field-wide' : '')}>
      <label htmlFor={id}>{label}</label>
      {children}
      <AnimatePresence>{error && <motion.p id={id + '-err'} className="field-err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>
    </div>
  )
}

// Mobile menu: a bottom sheet you can drag down to dismiss.
function MenuSheet({ onClose, onTalk }) {
  const layerRef = useSheet(onClose)
  const close = useRef(null)
  useEffect(() => { close.current?.focus({ preventScroll: true }) }, [])
  const items = [{ to: '/', label: 'Home' }, ...NAV]
  return (
    <div ref={layerRef} className="sheet-layer menu-layer" role="dialog" aria-modal="true" aria-label="Menu">
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      {/* A full-screen curtain on the dramatic curve, with the links masked in behind it. */}
      <motion.div
        className="menu"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        animate={{ clipPath: 'inset(0 0 0% 0)' }}
        exit={{ clipPath: 'inset(0 0 100% 0)' }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="menu-top">
          <Brand light />
          <button ref={close} type="button" className="menu-close" onClick={onClose} aria-label="Close menu">
            <span>Close</span><XIcon size={18} weight="bold" />
          </button>
        </div>

        <nav className="menu-nav" aria-label="Sections">
          {items.map((n, i) => (
            <Link key={n.to} to={n.to} onClick={onClose}>
              <span className="menu-index" aria-hidden="true">[{String(i + 1).padStart(2, '0')}]</span>
              <LineMask amount={0} delay={0.18 + i * 0.06}>{n.label}</LineMask>
            </Link>
          ))}
        </nav>

        <div className="menu-foot">
          <div>
            <MicroLabel as="p" dot={false}>Start a project</MicroLabel>
            <div className="menu-actions">
              <motion.button type="button" className="pill pill-red pill-lg" onClick={onTalk} {...press}>Let's Talk</motion.button>
              <a className="pill pill-outline pill-lg" href={CONTACT.phoneHref}><PhoneIcon size={18} weight="bold" />{CONTACT.phone}</a>
            </div>
          </div>
          <div>
            <MicroLabel as="p" dot={false}>Elsewhere</MicroLabel>
            <ul className="menu-links">
              <li><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></li>
              <li><a href={wa('Hi Creatix, I would like a free consultation.')} target="_blank" rel="noreferrer">WhatsApp</a></li>
              <li>{CONTACT.location}</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

