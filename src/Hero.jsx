import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRightIcon, PauseIcon, PlayIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import { ShaderAnimation } from '@/components/ui/shader-lines'
import { useReducedMotion } from './site-motion.jsx'
import { WORKFLOW, wa } from './content.js'
import { Display, MicroLabel, MotionLink, ScrollCue, SiteNav, press } from './ui.jsx'
import { Link } from './router.jsx'

export default function Hero({ onTalk, onMenu }) {
  const reduce = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const ref = useRef(null)

  // Depth on scroll: the copy lifts away and fades as the next section arrives.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const copyY = useTransform(p, [0, 1], [0, -90])
  const fade = useTransform(p, [0, 0.6], [1, 0])
  const still = reduce ? {} : null

  return (
    <section id="top" ref={ref} className="hero">
      <div className="hero-card">
        <ShaderAnimation className="hero-rings" paused={reduce || paused} />
        <div className="hero-scrim" />

        <SiteNav onTalk={onTalk} onMenu={onMenu} />

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
            <motion.a className="pill pill-glass pill-lg" href={wa('Hi Creatix, I want to know more about your services.')} target="_blank" rel="noreferrer" {...press}>
              <WhatsappLogoIcon size={20} weight="fill" />WhatsApp us
            </motion.a>
          </div>
        </motion.div>

        <div className="hero-base">
          <nav className="hero-foot" aria-label="How we work">
            {WORKFLOW.map((w, i) => (
              <Link key={w} to="/services#process"><span>{String(i + 1).padStart(2, '0')}</span>{w}</Link>
            ))}
          </nav>
          {!reduce && <ScrollCue />}
        </div>

        {!reduce && (
          <button type="button" className="hero-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play background animation' : 'Pause background animation'}>
            {paused ? <PlayIcon size={16} weight="fill" /> : <PauseIcon size={16} weight="fill" />}
          </button>
        )}
      </div>
    </section>
  )
}
