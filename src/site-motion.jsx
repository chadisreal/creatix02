import { createContext, useContext, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'

const MotionContext = createContext({ reduced: false, toggle: () => {} })

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
  return <MotionContext.Provider value={{ reduced, toggle, systemReduced }}>
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
  </MotionContext.Provider>
}

export const useSiteMotion = () => useContext(MotionContext)
export const useReducedMotion = () => useSiteMotion().reduced
