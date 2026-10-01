import { useCallback, useRef } from 'react'
import { liquidMetalFragmentShader, ShaderMount } from '@paper-design/shaders'

// Liquid metal surface, after the LiquidMetalButton reference: a black face inset 2px inside
// an animated chrome rim, where the rim is Paper's liquid-metal shader showing through.
//
// Rather than the reference's four stacked 3D layers per button, this is a ref you put on any
// element: it adds the shader layer and the face behind the element's own content, so the
// nav pills, the floating bar and the menu all wear the same material at whatever size they
// are. ShaderMount already pauses itself off-screen and in background tabs.

const UNIFORMS = {
  u_colorBack: [0, 0, 0, 0],
  u_colorTint: [1, 1, 1, 1],
  u_repetition: 4,
  u_softness: 0.5,
  u_shiftRed: 0.3,
  u_shiftBlue: 0.3,
  u_distortion: 0,
  u_contour: 0,
  u_angle: 45,
  u_shape: 1,
  u_isImage: false,
  // Sizing: the reference's scale 8 blows the shape up past the edges, so the rim only ever
  // shows the stripe pattern, never the shape's own outline.
  u_fit: 0,
  u_scale: 8,
  u_rotation: 0,
  u_offsetX: 0.1,
  u_offsetY: -0.1,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
  u_imageAspectRatio: 1,
}
const REST = 0.6, HOVER = 1, PRESS = 2.4

export function useLiquidMetal() {
  const off = useRef<(() => void) | null>(null)
  return useCallback((el: HTMLElement | null) => {
    off.current?.()
    off.current = null
    if (!el) return

    const rim = document.createElement('span')
    rim.className = 'metal-rim'
    const face = document.createElement('span')
    face.className = 'metal-face'
    el.prepend(rim, face)
    el.classList.add('metal')

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let mount: ShaderMount | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mount = new ShaderMount(rim, liquidMetalFragmentShader, UNIFORMS as any, undefined, still ? 0 : REST, 0, 1.5)
    } catch {
      // No WebGL2: the CSS rim on .metal-rim stands in.
    }

    let hovered = false, timer = 0
    const speed = (v: number) => { if (!still) mount?.setSpeed(v) }
    const enter = () => { hovered = true; speed(HOVER) }
    const leave = () => { hovered = false; speed(REST) }
    // The rim surges on press-down, the moment the finger lands, then eases back.
    const press = () => { speed(PRESS); clearTimeout(timer); timer = window.setTimeout(() => speed(hovered ? HOVER : REST), 300) }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', press)

    off.current = () => {
      clearTimeout(timer)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', press)
      mount?.dispose()
      rim.remove(); face.remove()
      el.classList.remove('metal')
    }
  }, [])
}
