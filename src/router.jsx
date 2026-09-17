// A small client router for a one-page site with real URLs.
// /about, /services, /portfolio and /contact are sections of the home page: links glide there and the address
// follows the scroll. A service link opens as a sheet over the page; loading its address directly shows its full page.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SECTIONS, findRoute, normalizePath } from './routes.js'

const RouterContext = createContext({ path: '/', bg: null, navigate: () => {}, closeSheet: () => {} })
export const useRouter = () => useContext(RouterContext)

// The screen a route is drawn on: every section shares the one page.
export const screenOf = path => findRoute(path).section ? '/' : normalizePath(path)

const topOf = id => {
  if (id === 'top') return 0
  const el = document.getElementById(id)
  if (!el) return null
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  return el.getBoundingClientRect().top + scrollY - pad
}
const calm = () => document.documentElement.classList.contains('motion-paused')

export function Router({ url, children }) {
  // bg: the address of the page shown behind an open service sheet.
  const [state, setState] = useState(() => ({ path: normalizePath(url ?? location.pathname), bg: null }))
  const now = useRef(state)
  now.current = state
  const pending = useRef(null) // where to scroll once a different screen has rendered
  const gliding = useRef(false)
  const settle = useRef(0)

  // While a link glides down the page, the address shouldn't flick through every section it passes.
  const glide = (top, smooth) => {
    gliding.current = true
    clearTimeout(settle.current)
    settle.current = setTimeout(() => { gliding.current = false }, 150)
    scrollTo({ top, behavior: smooth && !calm() ? 'smooth' : 'instant' })
  }

  const spy = () => {
    const { path, bg } = now.current
    if (bg || gliding.current || !findRoute(path).section) return
    let hit = SECTIONS[0]
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) hit = SECTIONS.at(-1)
    else for (const route of SECTIONS) {
      const el = document.getElementById(route.from ?? route.section)
      if (el && el.getBoundingClientRect().top <= innerHeight * 0.4) hit = route
    }
    if (hit.path === path) return
    history.replaceState(history.state, '', hit.path + location.search)
    setState({ path: hit.path, bg: null })
  }

  useEffect(() => {
    history.scrollRestoration = 'manual'
    const { path } = now.current
    // Old or messy addresses (/about.html, /team, /services/) settle on the clean URL. A reload never reopens a sheet.
    history.replaceState({ y: history.state?.y }, '', path + location.search + location.hash)
    const route = findRoute(path)
    const id = location.hash.slice(1) || route.section
    if (id && id !== 'top') {
      const land = () => glide(topOf(id) ?? 0, false)
      // Built pages jump to their section before the app loads (scripts/prerender.mjs); the dev server doesn't.
      if (scrollY === 0) land()
      // The web font and images arriving reflow the page above the section, so land again unless the visitor has moved.
      let moved = false
      for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(type, () => { moved = true }, { once: true, passive: true })
      document.fonts?.ready.then(() => moved || land())
      if (document.readyState !== 'complete') addEventListener('load', () => moved || land(), { once: true })
    }

    let frame = 0, idle = 0
    const onScroll = () => {
      if (gliding.current) {
        clearTimeout(settle.current)
        settle.current = setTimeout(() => { gliding.current = false; spy() }, 150)
      }
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(spy)
      clearTimeout(idle)
      idle = setTimeout(() => history.replaceState({ ...history.state, y: scrollY }, ''), 150)
    }
    const onPop = () => {
      const saved = history.state ?? {}
      const next = { path: normalizePath(location.pathname), bg: saved.bg ?? null }
      const from = now.current, fromScreen = screenOf(from.bg ?? from.path), toScreen = screenOf(next.bg ?? next.path)
      if (fromScreen !== toScreen) pending.current = { y: saved.y ?? 0 }
      else if (!from.bg && !next.bg) glide(saved.y ?? topOf(findRoute(next.path).section) ?? 0, true)
      setState(next)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('popstate', onPop)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('popstate', onPop)
      cancelAnimationFrame(frame)
      clearTimeout(idle)
    }
  }, [])

  useLayoutEffect(() => {
    const target = pending.current
    if (!target) return
    pending.current = null
    glide((target.id ? topOf(target.id) : target.y) ?? 0, false)
  }, [state])

  const navigate = to => {
    const next = new URL(to, location.href)
    const path = normalizePath(next.pathname)
    const route = findRoute(path)
    const id = next.hash.slice(1) || route.section
    const { path: here, bg } = now.current
    const onePage = screenOf(bg ?? here) === '/'
    history.replaceState({ ...history.state, y: scrollY }, '')

    if (route.page === 'service' && onePage) {
      if (path === here) return
      const entry = { y: scrollY, bg: bg ?? here }
      if (bg) history.replaceState(entry, '', path)
      else history.pushState(entry, '', path)
      setState({ path, bg: entry.bg })
      return
    }
    if (route.section && onePage) {
      const top = topOf(id) ?? 0
      if (path !== here || bg) history.pushState({ y: top }, '', path + next.search)
      setState({ path, bg: null })
      glide(top, true)
      return
    }
    history.pushState({ y: 0 }, '', path + next.search)
    pending.current = { id }
    setState({ path, bg: null })
  }

  const closeSheet = () => {
    const { bg } = now.current
    if (!bg) return
    if (history.state?.bg) return history.back()
    history.replaceState({ y: scrollY }, '', bg)
    setState({ path: bg, bg: null })
  }

  return <RouterContext.Provider value={{ ...state, navigate, closeSheet }}>{children}</RouterContext.Provider>
}

// A normal <a href>, so crawlers and new-tab clicks work; plain clicks stay inside the app.
export function Link({ to, onClick, ...props }) {
  const { navigate } = useRouter()
  return <a href={to} {...props} onClick={e => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target) return
    e.preventDefault()
    navigate(to)
  }} />
}
