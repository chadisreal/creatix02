import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, PauseIcon, PlayIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import { useReducedMotion } from './site-motion.jsx'
import { DISCIPLINES } from './StudioSections.jsx'
import { wa } from './content.js'
import { Display, LineMask, MicroLabel, MotionLink, SiteNav, press } from './ui.jsx'
import { Link } from './router.jsx'
import ShaderLines from '@/components/ui/shader-lines'
import { useLiquidMetal } from '@/components/ui/liquid-metal'

const SLIDES = DISCIPLINES
const HOLD = 6500

export default function Hero({ onTalk }) {
  const reduce = useReducedMotion()
  const waMetal = useLiquidMetal()
  const [paused, setPaused] = useState(false)
  const [i, setI] = useState(0)
  const ref = useRef(null)

  const go = step => {
    setPaused(true)
    setI(v => (v + step + SLIDES.length) % SLIDES.length)
  }

  // Advances on its own until the visitor takes over, and never when motion is reduced.
  useEffect(() => {
    if (reduce || paused) return
    const t = setTimeout(() => setI(v => (v + 1) % SLIDES.length), HOLD)
    return () => clearTimeout(t)
  }, [reduce, paused, i])

  // Depth on scroll: the copy lifts away as the next section arrives.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const copyY = useTransform(p, [0, 1], [0, -90])
  const fade = useTransform(p, [0, 0.6], [1, 0])
  const still = reduce ? {} : null
  const slide = SLIDES[i]

  return (
    <section id="top" ref={ref} className="hero">
      <div className="hero-card">
        {/* Live shader instead of photography: green light lines rippling out from the open
            half of the card. No image bytes, and the scrim below keeps it behind the type. */}
        <div className="hero-stage">
          <ShaderLines className="hero-lines" reduced={reduce} />
        </div>
        <div className="hero-scrim" />

        <SiteNav onTalk={onTalk} />

        <motion.div className="hero-copy" style={still ?? { y: copyY, opacity: fade }}>
          <MicroLabel className="hero-kicker">Independent thinking · Connected solutions · Jaipur</MicroLabel>
          <Display
            as="h1"
            className="hero-title display-h1"
            lines={['Digital, with a little', 'more difference.']}
            glassFrom={1}
          />
          <p className="hero-text">Creative minds. Precise engineering. We turn your next big idea into something that moves your business.</p>
          <div className="hero-cta">
            <MotionLink className="pill pill-red pill-lg" to="/services" {...press}>Explore what we do<ArrowUpRightIcon size={18} weight="bold" /></MotionLink>
            <motion.a ref={waMetal} className="pill pill-glass pill-lg" href={wa('Hi Creatix, I want to know more about your services.')} target="_blank" rel="noreferrer" {...press}>
              <WhatsappLogoIcon size={20} weight="fill" />WhatsApp us
            </motion.a>
          </div>
        </motion.div>

        {/* What the current frame is showing, re-masked on every change. */}
        <div className="hero-base">
          <div className="hero-slide-copy" key={i}>
            <span className="hero-slide-index" aria-hidden="true">[{String(i + 1).padStart(2, '0')}]</span>
            <p className="hero-slide-title"><LineMask amount={0}>{slide.title.replace(/\.$/, '')}</LineMask></p>
            <MicroLabel as="p" dot={false} className="hero-slide-label">{slide.label}</MicroLabel>
          </div>

          <div className="hero-dial">
            <span className="hero-count" aria-live="polite">{String(i + 1).padStart(2, '0')} <i aria-hidden="true">/</i> {String(SLIDES.length).padStart(2, '0')}</span>
            <div className="hero-arrows">
              <motion.button type="button" className="round" onClick={() => go(-1)} aria-label="Previous discipline" {...press}><ArrowLeftIcon size={17} weight="bold" /></motion.button>
              <motion.button type="button" className="round" onClick={() => go(1)} aria-label="Next discipline" {...press}><ArrowRightIcon size={17} weight="bold" /></motion.button>
            </div>
            <Link className="hero-slide-go" to="/services">See the work<ArrowUpRightIcon size={13} weight="bold" /></Link>
          </div>

          <nav className="hero-foot" aria-label="Disciplines">
            {SLIDES.map((s, n) => (
              <button
                key={s.title}
                type="button"
                className={'hero-tick' + (n === i ? ' is-on' : '')}
                aria-current={n === i ? 'true' : undefined}
                onClick={() => { setPaused(true); setI(n) }}
              >
                <span>{String(n + 1).padStart(2, '0')}</span>{s.title.replace(/\.$/, '')}
                <i aria-hidden="true" style={{ animationDuration: HOLD + 'ms' }} />
              </button>
            ))}
          </nav>

        </div>

        {!reduce && (
          <button type="button" className="hero-pause" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Resume the slideshow' : 'Pause the slideshow'}>
            {paused ? <PlayIcon size={16} weight="fill" /> : <PauseIcon size={16} weight="fill" />}
          </button>
        )}
      </div>
    </section>
  )
}
