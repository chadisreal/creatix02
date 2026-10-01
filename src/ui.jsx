// Small shared pieces used by more than one section, plus the motion vocabulary
// every section composes from.
//
// Rule this file exists to enforce: if a device has no state and no scroll linkage, it is
// a CSS keyframe or transition, not a motion component. Marquees, the shimmer, the scroll
// cue and every hover live in styles.css. That keeps the bundle flat and lets the single
// `.motion-paused *` rule switch all of them off without a JS branch per component.
import { useEffect, useRef, useState } from 'react'
import { motion, animate, useInView } from 'motion/react'
import { ArrowUpRightIcon, MoonStarsIcon, PhoneIcon, SunIcon } from '@phosphor-icons/react'
import { CONTACT } from './content.js'
import { findRoute } from './routes.js'
import { useReducedMotion, useSiteMotion } from './site-motion.jsx'
import MorphMenu from '@/components/ui/morph-menu'
import { useLiquidMetal } from '@/components/ui/liquid-metal'
import { Link, useRouter } from './router.jsx'

/* ---------- Motion vocabulary ---------- */

// Snappy: hovers, small reveals, anything the pointer is waiting on.
export const EASE = [0.22, 1, 0.36, 1]
// Dramatic: the big masked entrances. Slow in, fast through, slow out.
export const EASE_DRAMA = [0.76, 0, 0.24, 1]
// Staggered list items.
export const EASE_STAGGER = [0.25, 0.1, 0.25, 1]
export const SPRING = { type: 'spring', stiffness: 260, damping: 20 }

// Press feedback fires on pointer-down and springs back (Apple: respond on touch-down).
export const press = { whileTap: { scale: 0.96 }, transition: { type: 'spring', stiffness: 700, damping: 38 } }

// The standard scroll reveal.
export const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.8, ease: EASE },
}

// The same, staggered down a list.
export const stagger = i => ({
  ...reveal,
  transition: { duration: 0.6, ease: EASE_STAGGER, delay: i * 0.06 },
})

// The palette again, in JS. motion cannot interpolate var(), so scroll-linked colour
// animation needs literals. Keep in step with :root in styles.css.
export const TOKEN = { bg: '#0b0b0b', surface: '#1a1a1a', accent: '#34bb7b', ink: '#ffffff', muted: '#dcdcdc' }

export const MotionLink = motion.create(Link)

/* ---------- Primitives ---------- */

// The workhorse entrance: a line of type rises out of a clipping box. One mask per line,
// so a two-line heading arrives as two movements.
//
// The observer has to watch the MASK and drive the inner line through a variant, never
// watch the line itself. At rest the line is translated entirely outside the mask, and
// IntersectionObserver clips a target by its ancestors' overflow — so an observer on the
// line would see zero visible area, never satisfy its threshold, and leave the text
// permanently hidden. The mask is untransformed, so it always reports honestly.
//
// It also has to branch on reduced motion rather than leaning on MotionConfig: the resting
// state is off-mask, so anything that declines to animate the transform would leave the
// text invisible rather than merely still.
// `inherit` hands the timing to the nearest animating parent instead of this line watching
// the viewport for itself: variant labels propagate down, so the mask passes the parent's
// label through to the line. The menu drives its links that way, because a whileInView line
// starts its own clock the moment it mounts and ends up racing the entrance around it.
export function LineMask({ children, delay = 0, className, amount = 0.6, inherit = false, variants }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={['line', className].filter(Boolean).join(' ')}>{children}</span>
  const watch = inherit ? {} : { initial: 'rest', whileInView: 'shown', viewport: { once: true, amount } }
  return (
    <motion.span
      className="line-mask"
      {...watch}
    >
      <motion.span
        className={['line', className].filter(Boolean).join(' ')}
        variants={variants ?? { rest: { y: '112%' }, shown: { y: '0%' } }}
        transition={inherit ? undefined : { duration: 1, ease: EASE_DRAMA, delay }}
      >
        {children}
      </motion.span>
    </motion.span>
  )
}

// A two-tone display heading: the first line solid, the rest outlined with a sheen
// travelling across it. Both lines stay inside one heading element, because every route
// is asserted to have exactly one h1.
export function Display({ as: As = 'h2', lines, className = '', id, glassFrom = 1 }) {
  return (
    <As id={id} className={['display', className].filter(Boolean).join(' ')}>
      {lines.map((line, i) => (
        <LineMask key={i} delay={i * 0.08} className={i >= glassFrom ? 'liquid-glass' : undefined}>
          {line}
        </LineMask>
      ))}
    </As>
  )
}

// Mono, uppercase, wide-tracked and small, with a square accent dot. Set against the
// display sizes above, this contrast is most of what reads as editorial.
export function MicroLabel({ children, dot = true, light = false, as: As = 'p', className = '' }) {
  return (
    <As className={['eyebrow', !dot && 'eyebrow-bare', light && 'eyebrow-light', className].filter(Boolean).join(' ')}>
      {children}
    </As>
  )
}

// A band of content running sideways for ever, duplicated once so the loop is seamless.
// CSS drives it; the clone is hidden from assistive tech and the real label carries the text.
export function Marquee({ children, speed = 40, reverse = false, className = '', label }) {
  return (
    <div
      className={['marquee', className].filter(Boolean).join(' ')}
      style={{ '--marquee-duration': speed + 's' }}
      role="marquee"
      aria-label={label}
    >
      <div className="marquee-track" data-reverse={reverse ? '' : undefined} aria-hidden="true">
        {children}
        {children}
      </div>
    </div>
  )
}

// Imagery settles into its window, sits dimmed, and lifts on hover.
//
// The entrance transform goes on an inner element, never on .frame itself. .frame is the
// clipping box, and an element cannot clip its own transform: an earlier version animated
// x: 40 on the frame and pushed 21px past the right edge of a 390px viewport while it
// waited to come into view, which is a horizontal scrollbar on every phone. Scaling down
// inside the clip cannot overflow anything.
export function Frame({ src, alt = '', className = '', glow = false, ratio, children, ...img }) {
  const reduce = useReducedMotion()
  return (
    <div className={['frame', className].filter(Boolean).join(' ')} style={ratio ? { aspectRatio: ratio } : undefined}>
      {glow && <span className="frame-glow" aria-hidden="true" />}
      <motion.div
        className="frame-inner"
        initial={reduce ? false : { opacity: 0, scale: 1.08 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: EASE_DRAMA }}
      >
        {src && <img src={src} alt={alt} loading="lazy" decoding="async" {...img} />}
        {children}
      </motion.div>
    </div>
  )
}

// A mark travelling down a short track, to say the page continues. Pure CSS.
export function ScrollCue({ label = 'Scroll' }) {
  return (
    <div className="scroll-cue" aria-hidden="true">
      <span className="scroll-cue-label">{label}</span>
      <span className="scroll-cue-track"><i /></span>
    </div>
  )
}

// Counts up once, when it comes into view.
export function Counter({ to, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (reduce) { setValue(to); return }
    const run = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setValue(Math.round(v)),
    })
    return () => run.stop()
  }, [inView, reduce, to])
  return <span ref={ref}>{value}{suffix}</span>
}

/* ---------- Navigation ---------- */

export const NAV = [
  { to: '/about', label: 'Studio' },
  { to: '/services', label: 'Expertise' },
  { to: '/portfolio', label: 'Work' },
  { to: '/contact', label: 'Contact' },
]

// The nav item for the current page (a service page counts as Expertise).
export function useNavCurrent() {
  const { path } = useRouter()
  const route = findRoute(path)
  return to => to === route.path || to === route.parent
}

// Extra props reach the Link: the menu passes onClick so the logo closes it on the way home,
// which it previously did not, leaving the menu open over a page that had navigated.
/* ---------- Theme switch ---------- */

// The click. A 30ms noise burst through a bandpass is a switch; a sine blip is a doorbell.
// Synthesised rather than shipped as a file: no asset to host, no request, no decode.
// One context for the page, built on the first click because browsers block audio until a
// gesture, and resumed each time in case the tab was backgrounded in between.
let audio
function playSwitch() {
  const AC = window.AudioContext ?? window.webkitAudioContext
  if (!AC) return
  try {
    audio ??= new AC()
    if (audio.state === 'suspended') audio.resume()
    const len = Math.floor(audio.sampleRate * 0.03)
    const buffer = audio.createBuffer(1, len, audio.sampleRate)
    const data = buffer.getChannelData(0)
    // Cubic decay: all the energy in the first few milliseconds, like a contact closing.
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    const source = audio.createBufferSource()
    source.buffer = buffer
    const band = audio.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2400
    band.Q.value = 1.4
    const gain = audio.createGain()
    gain.gain.value = 0.28
    source.connect(band).connect(gain).connect(audio.destination)
    source.start()
  } catch { /* Sound is a nicety and must never take the toggle down with it. */ }
}

// Dark/light, as a real switch: the knob springs across and carries the click with it.
// role="switch" + aria-checked is the native semantic, so screen readers announce a state
// rather than a button whose label has to explain itself.
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useSiteMotion()
  const reduce = useReducedMotion()
  const light = theme === 'light'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label="Light mode"
      className={['theme-toggle', className].filter(Boolean).join(' ')}
      onClick={() => { playSwitch(); toggleTheme() }}
    >
      <SunIcon size={13} weight="bold" aria-hidden="true" />
      <MoonStarsIcon size={13} weight="bold" aria-hidden="true" />
      <motion.span
        className="theme-knob"
        aria-hidden="true"
        /* Knob sits over the mode you are NOT in, so the icon left showing is the current
           one: dark leaves the moon visible, light leaves the sun. */
        animate={{ x: light ? 26 : 0 }}
        transition={reduce ? { duration: 0.12 } : { type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

export function Brand({ light = false, ...props }) {
  return (
    <Link className={'brand' + (light ? ' brand-light' : '')} to="/" aria-label="Creatix Innovation, home" {...props}>
      <img className="on-dark" src="/img/creatix-mark.png" alt="" width="32" height="32" />
      <img className="on-light" src="/img/creatix-mark-ink.png" alt="" width="32" height="32" />
      <span>Creatix <b>Innovation</b></span>
    </Link>
  )
}

// The navigation that sits over the top of every page's hero.
export function SiteNav({ onTalk }) {
  const isCurrent = useNavCurrent()
  const linksMetal = useLiquidMetal()
  const phoneMetal = useLiquidMetal()
  return (
    <header className="hero-nav">
      <Brand light />
      <nav ref={linksMetal} className="hero-links" aria-label="Main">
        {NAV.map(n => <Link key={n.to} to={n.to} aria-current={isCurrent(n.to) ? 'page' : undefined}>{n.label}</Link>)}
      </nav>
      <div className="hero-actions">
        <a ref={phoneMetal} className="pill pill-glass hide-sm" href={CONTACT.phoneHref}><PhoneIcon size={16} weight="bold" />{CONTACT.phone}</a>
        <motion.button type="button" className="pill pill-white" onClick={onTalk} {...press}>Let's Talk<ArrowUpRightIcon size={16} weight="bold" /></motion.button>
        <MorphMenu />
      </div>
    </header>
  )
}
