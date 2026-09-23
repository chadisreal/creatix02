import { motion, useScroll } from 'motion/react'
import { Marquee } from './ui.jsx'
import { useSiteMotion } from './site-motion.jsx'

export const DISCIPLINES = [
  { title: 'Web & mobile.', label: 'Experiences that connect', text: 'Make every interaction count. Custom websites, ecommerce experiences, and applications that put your customers first.', ids: ['web', 'app', 'uiux'], tone: 'paper' },
  { title: 'Business, connected.', label: 'Systems that make sense', text: 'Bring your teams, customers, and operations together with software built around the way you work.', ids: ['crm', 'erp', 'pos', 'hrms', 'mgmt', 'salesforce'], tone: 'lilac' },
  { title: 'Designed to be felt.', label: 'Brands with something to say', text: 'A distinct identity. A better experience. Design and storytelling that give people a reason to remember you.', ids: ['design', 'marketing', 'video'], tone: 'peach' },
  { title: 'Make room for growth.', label: 'Less repetition. More possibility.', text: 'Connect your tools, automate the repetitive work, and keep your digital business running smoothly.', ids: ['automation', 'care'], tone: 'ink' },
]

export function ManifestoStrip() {
  const words = ['Thoughtfully designed', 'Precisely engineered', 'Built for your business']
  return (
    <Marquee className="manifesto-strip" speed={44} label={words.join('. ') + '.'}>
      <span className="manifesto-run">
        {words.map(w => <span key={w}>{w}<i aria-hidden="true" /></span>)}
      </span>
    </Marquee>
  )
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
}

export function MotionToggle() {
  const { reduced, toggle, systemReduced } = useSiteMotion()
  return <button type="button" className="motion-toggle" aria-pressed={reduced} onClick={toggle} disabled={systemReduced} title={systemReduced ? 'Reduced motion follows your device settings' : undefined}>Motion: {reduced ? 'off' : 'on'} <span aria-hidden="true">{reduced ? '○' : '◉'}</span></button>
}
