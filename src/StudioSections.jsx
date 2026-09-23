import { motion, useScroll } from 'motion/react'
import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { SERVICES } from './content.js'
import { useSiteMotion } from './site-motion.jsx'
import { Link } from './router.jsx'

export const DISCIPLINES = [
  { title: 'Web & mobile.', label: 'Experiences that connect', text: 'Make every interaction count. Custom websites, ecommerce experiences, and applications that put your customers first.', ids: ['web', 'app', 'uiux'], tone: 'paper' },
  { title: 'Business, connected.', label: 'Systems that make sense', text: 'Bring your teams, customers, and operations together with software built around the way you work.', ids: ['crm', 'erp', 'pos', 'hrms', 'mgmt', 'salesforce'], tone: 'lilac' },
  { title: 'Designed to be felt.', label: 'Brands with something to say', text: 'A distinct identity. A better experience. Design and storytelling that give people a reason to remember you.', ids: ['design', 'marketing', 'video'], tone: 'peach' },
  { title: 'Make room for growth.', label: 'Less repetition. More possibility.', text: 'Connect your tools, automate the repetitive work, and keep your digital business running smoothly.', ids: ['automation', 'care'], tone: 'ink' },
]

export function DisciplineStack() {
  return <div className="discipline-stack">
    {DISCIPLINES.map((item, i) => <article key={item.title} className={'discipline discipline-' + item.tone} style={{ '--order': i }}>
      <div className="discipline-top"><span>0{i + 1}</span><span>{item.label}</span><ArrowUpRightIcon size={28} /></div>
      <div className="discipline-main"><h3>{item.title}</h3><div><p>{item.text}</p><div className="discipline-links">
        {item.ids.map(id => { const s = SERVICES.find(x => x.id === id); return <Link key={id} to={'/' + s.slug}>{s.title}<ArrowUpRightIcon size={15} /></Link> })}
      </div></div></div>
    </article>)}
  </div>
}

export function ManifestoStrip() {
  return <div className="manifesto-strip" aria-label="Thoughtfully designed. Precisely engineered. Built for your business.">
    <div aria-hidden="true">{[0, 1].map(i => <span key={i}>Thoughtfully designed <b>✳</b> Precisely engineered <b>✳</b> Built for your business <b>✳</b></span>)}</div>
  </div>
}

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
}

export function MotionToggle() {
  const { reduced, toggle, systemReduced } = useSiteMotion()
  return <button type="button" className="motion-toggle" aria-pressed={reduced} onClick={toggle} disabled={systemReduced} title={systemReduced ? 'Reduced motion follows your device settings' : undefined}>Motion: {reduced ? 'off' : 'on'} <span aria-hidden="true">{reduced ? '○' : '◉'}</span></button>
}
