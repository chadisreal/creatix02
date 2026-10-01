import { useEffect } from 'react'

// Pixel-arrow hover for the green buttons, after the Nextjsshop "Button01" reference, built the
// same way it is: the right end of the button is a 5×5 block of pixels, and an 11-pixel ↗ sits
// in the same grid on top. On hover the block's pixels blink out in four random waves (index
// 0–3), then the arrow's pixels blink in over the next four (index 4–7). The blinks are instant,
// with no fades: that hard on/off is what makes it read as pixels rather than a dissolve. Leaving
// runs it backwards. At rest the block's centre pixel is a dark square, as in the reference.
//
// It decorates every .pill-red on the page, including ones that mount later (the floating nav,
// the contact form), so call sites need no change: they stay plain .pill-red buttons.

const ARROW = [
  '.####',
  '...##',
  '..#.#',
  '.#..#',
  '#....',
].join('') // the reference's 11 overlay pixels
const CENTRE = 12
const wave = (from: number) => String(from + Math.floor(Math.random() * 4))
// Bump when the markup below changes: buttons decorated by an older version (kept alive by a
// hot reload, which swaps the CSS but not the pixels already in the page) get rebuilt.
const VERSION = '4'
const SELECTOR = `.pill-red:not([data-px="${VERSION}"])`

function pixelate(el: HTMLElement) {
  el.dataset.px = VERSION
  el.querySelectorAll(':scope > .px-body, :scope > .px-tile, :scope > .px-arrow, :scope > .px-layer').forEach(n => n.remove())
  const body = document.createElement('span')
  body.className = 'px-body'
  const tile = document.createElement('span')
  tile.className = 'px-tile'
  const arrow = document.createElement('span')
  arrow.className = 'px-arrow'
  for (const n of [body, tile, arrow]) n.setAttribute('aria-hidden', 'true')

  ;[...ARROW].forEach((c, i) => {
    const b = document.createElement('i')
    if (i === CENTRE) b.className = 'dot'
    b.style.setProperty('--i', wave(0))
    tile.append(b)
    const a = document.createElement('i')
    if (c === '#') { a.className = 'a'; a.style.setProperty('--i', wave(4)) }
    arrow.append(a)
  })
  el.prepend(body, tile, arrow)
}

export function usePixelButtons() {
  useEffect(() => {
    const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach(pixelate)
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
}
