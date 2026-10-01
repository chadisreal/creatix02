import { useEffect } from 'react'

// Pixel-arrow hover for the green buttons, after the Nextjsshop "Button01" reference. At rest the
// button carries a small square at its right end. On hover that end splits off into its own
// rounded tile, and the square grows into a pixel ↗: the arrow's pixels light up outward from the
// square, nearest first, so it reads as the square drawing the arrow rather than noise resolving.
// The arrow is drawn in the label's colour on the button's green, so it reads in every theme.
//
// It decorates every .pill-red on the page, including ones that mount later (the floating nav,
// the contact form), so call sites need no change: they stay plain .pill-red buttons.

// ↗ in the middle 5×5 of a 7×7 grid. The one-cell margin keeps the arrowhead clear of the
// button's rounded corner, which used to clip it. The centre cell is the resting square.
const ARROW = [
  '.......',
  '...###.',
  '....##.',
  '...#.#.',
  '..#....',
  '.#.....',
  '.......',
].join('')
const SIZE = 7, CENTRE = 24
const STEP = 45 // ms between rings of pixels as the arrow grows out from the square
// Bump when the markup below changes: buttons decorated by an older version (kept alive by a
// hot reload, which swaps the CSS but not the pixels already in the page) get rebuilt.
const VERSION = '3'
const SELECTOR = `.pill-red:not([data-px="${VERSION}"])`

function pixelate(el: HTMLElement) {
  el.dataset.px = VERSION
  el.querySelectorAll(':scope > .px-body, :scope > .px-tile, :scope > .px-layer').forEach(n => n.remove())
  const body = document.createElement('span')
  body.className = 'px-body'
  const tile = document.createElement('span')
  tile.className = 'px-tile'
  for (const n of [body, tile]) n.setAttribute('aria-hidden', 'true')

  ;[...ARROW].forEach((c, i) => {
    const px = document.createElement('i')
    if (c === '#') {
      px.className = i === CENTRE ? 'a dot' : 'a'
      const dist = Math.max(Math.abs((i % SIZE) - 3), Math.abs(Math.floor(i / SIZE) - 3))
      px.style.setProperty('--d', String(dist * STEP))
    }
    tile.append(px)
  })
  el.prepend(body, tile)
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
