import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import './shader-lines.css'

type ShaderAnimationProps = {
  className?: string
  /** Hold the current frame (pause button, reduced motion). A still frame is still drawn. */
  paused?: boolean
}

const vertexSource = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0., 1.); }
`

// The reference's expanding line rings: mosaic cells, per-column time jitter and a three-channel fringe.
// Reworked into two calm bands that fade in and out (no pop when they wrap), tinted from CSS rather than raw RGB.
const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 u_center;
  uniform float u_radius;
  uniform vec2 u_cell;
  uniform float u_line;
  uniform float u_phase;
  uniform vec3 u_color;
  uniform vec3 u_lead;
  uniform vec3 u_trail;

  float random(float x) { return fract(sin(x) * 1e4); }

  void main() {
    vec2 cell = (floor(gl_FragCoord.xy / u_cell) + .5) * u_cell;
    float d = length(cell - u_center) / u_radius;
    if (d > 1.2) { gl_FragColor = vec4(0.); return; }
    float jitter = random(floor(gl_FragCoord.x / u_cell.x) * .173 + 1.) * .02;
    vec3 light = vec3(0.);
    for (int band = 0; band < 2; band++) {
      float head = fract(u_phase + float(band) * .5 + jitter);
      float life = smoothstep(.04, .16, head) * (1. - smoothstep(.62, .98, head));
      vec3 glow = vec3(0.);
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          float ring = head + .02 * float(i - 4) - .006 * float(j);
          // Squared falloff keeps each ring a crisp line with a short halo instead of a haze.
          float q = u_line * float(i * i) / max(abs(ring - d) * u_radius, u_cell.y * .5);
          glow[j] += q * q * .15 + q * .02;
        }
      }
      light += glow * life;
    }
    vec3 c = light.x * u_lead + light.y * u_color + light.z * u_trail;
    c = (1. - exp(-c * 1.2)) * (1. - smoothstep(.85, 1.2, d));
    gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
  }
`

const HOLD_PHASE = .36 // a still frame with both bands in view
const RINGS_PER_SECOND = .09
// Rings snap to mosaic cells, so frames beyond this change nothing visible and only cost battery.
const FRAME_MS = 1000 / 30

export function ShaderAnimation({ className, paused = false }: ShaderAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const syncRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    pausedRef.current = paused
    syncRef.current?.()
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!gl) return // The host's CSS glow stands in.

    let dispose = () => {}
    const setup = () => {
      const shaders: WebGLShader[] = []
      const compile = (source: string, type: number) => {
        const shader = gl.createShader(type)
        if (!shader) return null
        shaders.push(shader)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
      }
      const vertex = compile(vertexSource, gl.VERTEX_SHADER)
      const fragment = compile(fragmentSource, gl.FRAGMENT_SHADER)
      const program = gl.createProgram()
      const buffer = gl.createBuffer()
      const release = () => {
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        shaders.forEach(shader => gl.deleteShader(shader))
      }
      if (!vertex || !fragment || !program || !buffer) { release(); return }
      gl.attachShader(program, vertex)
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { release(); return }
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const position = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      const u = (name: string) => gl.getUniformLocation(program, name)
      const uniforms = { center: u('u_center'), radius: u('u_radius'), cell: u('u_cell'), line: u('u_line'), phase: u('u_phase'), color: u('u_color'), lead: u('u_lead'), trail: u('u_trail') }

      const motion = matchMedia('(prefers-reduced-motion: reduce)')
      const finePointer = matchMedia('(pointer: fine)')
      const layout = { x: 0, y: 0, radius: 1, scale: 1 } // canvas pixels
      const drift = { x: 0, y: 0, tx: 0, ty: 0 }
      let quality = 1 // drops if the device can't keep up
      let phase = HOLD_PHASE
      let frame = 0, wait = 0, last = 0, visible = false
      let slow = 0, counted = 0

      // Placement, size and colour come from CSS custom properties, so media queries control them.
      const readStyle = () => {
        const style = getComputedStyle(canvas)
        const num = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback
        const probe = document.createElement('canvas').getContext('2d')
        const rgb = (value: string, fallback: string) => {
          if (!probe) return [1, 1, 1]
          probe.fillStyle = fallback
          probe.fillStyle = value.trim() || fallback
          const hex = probe.fillStyle.startsWith('#') ? probe.fillStyle : fallback
          return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        }
        const color = rgb(style.getPropertyValue('--rings-color') || style.color, '#d4c2f0')
        const lead = rgb(style.getPropertyValue('--rings-lead'), '#8f6fd6')
        const trail = rgb(style.getPropertyValue('--rings-trail'), '#e0503f')
        gl.uniform3f(uniforms.color, color[0], color[1], color[2])
        gl.uniform3f(uniforms.lead, lead[0], lead[1], lead[2])
        gl.uniform3f(uniforms.trail, trail[0], trail[1], trail[2])
        return { x: num('--rings-x', .72), y: num('--rings-y', .46), size: num('--rings-size', .6), cell: num('--rings-cell', 5), line: num('--rings-line', .5) }
      }

      const draw = () => {
        gl.uniform2f(uniforms.center, layout.x + drift.x, layout.y + drift.y)
        gl.uniform1f(uniforms.phase, phase)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        if (!('ready' in canvas.dataset)) canvas.dataset.ready = ''
      }

      const resize = () => {
        const width = Math.max(1, host.clientWidth)
        const height = Math.max(1, host.clientHeight)
        // Mosaic cells make extra pixels pointless: cap the pixel ratio and the total pixel count.
        const budget = (width < 768 ? 320_000 : 1_000_000) * quality
        const scale = Math.max(.35, Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(budget / (width * height))))
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)
        gl.viewport(0, 0, canvas.width, canvas.height)
        const css = readStyle()
        layout.scale = scale
        layout.x = css.x * canvas.width
        layout.y = (1 - css.y) * canvas.height
        layout.radius = css.size * Math.min(canvas.width, canvas.height)
        gl.uniform1f(uniforms.radius, layout.radius)
        gl.uniform2f(uniforms.cell, Math.max(1, Math.round(css.cell * scale)), Math.max(1, Math.round(css.cell * scale * .5)))
        gl.uniform1f(uniforms.line, css.line * scale)
        draw()
      }

      const playing = () => visible && !document.hidden && !pausedRef.current && !motion.matches
      // Sleep between frames rather than waking on every display refresh just to skip it.
      const next = () => { wait = window.setTimeout(() => { wait = 0; frame = requestAnimationFrame(render) }, FRAME_MS - 12) }
      const render = (now: number) => {
        frame = 0
        if (!playing()) return
        const dt = last ? Math.min(now - last, 100) : 0
        last = now
        phase = (phase + dt / 1000 * RINGS_PER_SECOND) % 1
        const ease = 1 - Math.exp(-dt / 350)
        drift.x += (drift.tx - drift.x) * ease
        drift.y += (drift.ty - drift.y) * ease
        draw()
        // After a settling period, step the resolution down once frames run long, instead of stuttering.
        if (dt && ++counted > 90) {
          slow = slow * .9 + (dt > 50 ? .1 : 0)
          if (slow > .5 && quality > .4) { quality *= .7; slow = 0; counted = 0; resize() }
        }
        next()
      }
      const sync = () => {
        cancelAnimationFrame(frame)
        clearTimeout(wait)
        frame = wait = 0
        last = 0
        if (playing()) frame = requestAnimationFrame(render)
        else if (visible) draw()
      }
      syncRef.current = sync

      const move = (event: PointerEvent) => {
        if (!finePointer.matches) return
        const rect = host.getBoundingClientRect()
        // The rings lean a little toward the pointer rather than following it.
        drift.tx = ((event.clientX - rect.left) * layout.scale - layout.x) * .06
        drift.ty = ((rect.bottom - event.clientY) * layout.scale - layout.y) * .06
      }
      const leave = () => { drift.tx = 0; drift.ty = 0 }
      const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
      const size = new ResizeObserver(resize)
      visibility.observe(host)
      size.observe(host)
      host.addEventListener('pointermove', move, { passive: true })
      host.addEventListener('pointerleave', leave)
      document.addEventListener('visibilitychange', sync)
      motion.addEventListener('change', sync)
      resize()

      dispose = () => {
        cancelAnimationFrame(frame)
        clearTimeout(wait)
        syncRef.current = null
        visibility.disconnect()
        size.disconnect()
        host.removeEventListener('pointermove', move)
        host.removeEventListener('pointerleave', leave)
        document.removeEventListener('visibilitychange', sync)
        motion.removeEventListener('change', sync)
        release()
      }
    }
    const lost = (event: Event) => { event.preventDefault(); dispose() }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', setup)
    // Compile and draw once the page has loaded and the browser is idle, so the rings never delay the first paint.
    let pending = 0
    const later = () => { pending = 'requestIdleCallback' in window ? requestIdleCallback(setup, { timeout: 1200 }) : setTimeout(setup, 200) }
    if (document.readyState === 'complete') later()
    else addEventListener('load', later, { once: true })
    return () => {
      removeEventListener('load', later)
      if ('cancelIdleCallback' in window) cancelIdleCallback(pending)
      clearTimeout(pending)
      dispose()
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', setup)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('shader-lines pointer-events-none absolute inset-0 h-full w-full', className)} />
}
