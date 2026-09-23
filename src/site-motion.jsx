import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { MotionConfig, useAnimationFrame } from 'motion/react'

const MotionContext = createContext({ reduced: false, toggle: () => {}, lenisRef: { current: null } })

// Follows the device setting live (motion's own hook only reads it once).
function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function SiteMotion({ children }) {
  const system = useSystemReducedMotion()
  const [paused, setPaused] = useState(false)
  // Pages are prerendered with motion on; preferences apply once the browser has taken over.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try { setPaused(localStorage.getItem('creatix-motion') === 'off') } catch { /* Storage is optional. */ }
    setReady(true)
  }, [])
  const systemReduced = ready && Boolean(system)
  const reduced = ready && Boolean(system || paused)
  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', reduced)
  }, [reduced])
  const toggle = () => setPaused(value => {
    try { localStorage.setItem('creatix-motion', value ? 'on' : 'off') } catch { /* Storage is optional. */ }
    return !value
  })

  // This module is the only place allowed to import lenis. It already owns the three motion
  // inputs and the .motion-paused class, so keeping the smooth-scroll lifecycle here means
  // one switch flips all of them together. Everything else reads the instance from context.
  const lenisRef = useRef(null)
  useEffect(() => {
    // Reduced motion gets destroy(), never stop(): a stopped instance stays installed, keeps
    // its html classes and inline styles, and goes on swallowing wheel events.
    if (!ready || reduced) return
    let instance = null
    let cancelled = false
    // Imported inside the effect, not at module scope: entry-server.jsx renders this
    // component through renderToString during `vite build --ssr`, where window does not exist.
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return
      instance = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false })
      lenisRef.current = instance
      // The router drives it, and the Playwright checks need a deterministic handle.
      window.__lenis = instance
    })
    return () => {
      cancelled = true
      instance?.destroy()
      lenisRef.current = null
      if (window.__lenis === instance) delete window.__lenis
    }
  }, [ready, reduced])

  // Share motion's frameloop rather than letting Lenis run its own (autoRaf: false above).
  // With two independent rAF loops, every scroll-linked effect on the page reads a scroll
  // position Lenis has not committed yet this frame, which shows up as a one-frame lag on
  // the hero, the reading-reveal paragraph and the process steps.
  useAnimationFrame(time => lenisRef.current?.raf(time))

  return <MotionContext.Provider value={{ reduced, toggle, systemReduced, lenisRef }}>
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
  </MotionContext.Provider>
}

export const useSiteMotion = () => useContext(MotionContext)
export const useReducedMotion = () => useSiteMotion().reduced
// Returns the ref, not the instance: it is populated asynchronously after the dynamic
// import resolves, and callers read it at the moment they scroll rather than on render.
export const useLenis = () => useSiteMotion().lenisRef
