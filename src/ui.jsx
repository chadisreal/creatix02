// Small shared pieces used by more than one section.
import { motion } from 'motion/react'
import { ArrowUpRightIcon, ListIcon, PhoneIcon } from '@phosphor-icons/react'
import { CONTACT } from './content.js'
import { findRoute } from './routes.js'
import { Link, useRouter } from './router.jsx'

// Press feedback fires on pointer-down and springs back (Apple: respond on touch-down).
export const press = { whileTap: { scale: 0.96 }, transition: { type: 'spring', stiffness: 700, damping: 38 } }
export const EASE = [0.22, 1, 0.36, 1]

export const MotionLink = motion.create(Link)

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

export function Brand({ light = false }) {
  return (
    <Link className={'brand' + (light ? ' brand-light' : '')} to="/" aria-label="Creatix Innovation, home">
      <img src="/img/creatix-mark.png" alt="" width="32" height="32" />
      <span>Creatix <b>Innovation</b></span>
    </Link>
  )
}

// The navigation that sits over the top of every page's hero card.
export function SiteNav({ onTalk, onMenu }) {
  const isCurrent = useNavCurrent()
  return (
    <header className="hero-nav">
      <Brand light />
      <nav className="hero-links" aria-label="Main">
        {NAV.map(n => <Link key={n.to} to={n.to} aria-current={isCurrent(n.to) ? 'page' : undefined}>{n.label}</Link>)}
      </nav>
      <div className="hero-actions">
        <a className="pill pill-glass hide-sm" href={CONTACT.phoneHref}><PhoneIcon size={16} weight="bold" />{CONTACT.phone}</a>
        <motion.button type="button" className="pill pill-white" onClick={onTalk} {...press}>Let's Talk<ArrowUpRightIcon size={16} weight="bold" /></motion.button>
        <button type="button" className="pill pill-glass icon-only show-sm" onClick={onMenu} aria-label="Open menu"><ListIcon size={20} weight="bold" /></button>
      </div>
    </header>
  )
}
