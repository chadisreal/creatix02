import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLiquidMetal } from './liquid-metal'
import { Link } from '@/router.jsx'
import { NAV, ThemeToggle, useNavCurrent } from '@/ui.jsx'
import { useReducedMotion } from '@/site-motion.jsx'
import { CONTACT } from '@/content.js'

// Critically damped both ways, so nothing wobbles. Folding shut is stiffer than opening, as iOS
// menus are: you wait for what you asked to see, not for what you dismissed. Being springs, a
// second tap mid-flight reverses from wherever the panel is rather than waiting it out.
const OPEN_SPRING = { type: 'spring', stiffness: 320, damping: 36 } as const
const CLOSE_SPRING = { type: 'spring', stiffness: 520, damping: 46 } as const
const CLOSED = { width: 112, height: 44, borderRadius: 22 }
const HIDDEN = { opacity: 0, y: -8 }

// The menu pill that morphs, in place, into the menu. It grows down and to the left from the
// button that opened it (the top-right corner stays pinned), so it reads as the button
// becoming the menu rather than a sheet arriving from elsewhere. It never leaves its slot.
export default function MorphMenu() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const isCurrent = useNavCurrent()
  const metal = useLiquidMetal()
  const root = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLAnchorElement>(null)
  const id = useId()
  // Read at render, not module load: ui.jsx imports this file, so NAV is not ready at load time.
  const items = [{ to: '/', label: 'Home' }, ...NAV]

  useEffect(() => {
    if (!open) return
    first.current?.focus({ preventScroll: true })
    const out = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key) }
  }, [open])

  const size = open
    ? { width: Math.min(300, document.documentElement.clientWidth - 32), height: 392, borderRadius: 30 }
    : CLOSED
  const spring = reduce ? { duration: 0 } : open ? OPEN_SPRING : CLOSE_SPRING

  return (
    <div ref={root} className="mm">
      <motion.div ref={metal} className="mm-surface tone-dark" data-open={open || undefined} initial={false} animate={size} transition={spring}>
        <button
          type="button"
          className="mm-bar"
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(v => !v)}
        >
          <span>Menu</span>
          <span className="mm-icon" aria-hidden="true"><i /><i /></span>
        </button>

        <nav id={id} className="mm-nav" aria-label="Menu" hidden={!open}>
          {items.map((n, i) => (
            <motion.div
              key={n.to}
              initial={false}
              animate={open ? { opacity: 1, y: 0 } : HIDDEN}
              transition={reduce ? { duration: 0 } : open
                ? { duration: 0.4, delay: 0.12 + 0.04 * i, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.12 }}
            >
              {/* Current page is announced, not painted: green is the hover, so it always
                  means "this is where the pointer is". */}
              <Link
                ref={i === 0 ? first : undefined}
                to={n.to}
                instant
                className="mm-item"
                aria-current={isCurrent(n.to) ? 'page' : undefined}
                aria-label={n.label}
                onClick={() => setOpen(false)}
              >
                {/* Each letter is a two-high column; hover rolls it up one, staggered. */}
                {[...n.label].map((c, k) => (
                  <span key={k} className="mm-ch" aria-hidden="true" style={{ '--i': k } as React.CSSProperties}>
                    <span>{c}<br />{c}</span>
                  </span>
                ))}
              </Link>
            </motion.div>
          ))}
          <motion.div
            className="mm-foot"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : open ? { duration: 0.35, delay: 0.32 } : { duration: 0.12 }}
          >
            <ThemeToggle />
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </motion.div>
        </nav>
      </motion.div>
    </div>
  )
}
