import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Shader lines, after the Three.js ShaderAnimation reference: rings of mosaic light lines
// expanding from the centre. Same fragment shader, but on a bare WebGL quad: the reference
// pulls all of three.js (r89, ~600KB) off a CDN at runtime to draw one fullscreen triangle.
//
// Recoloured to the site: the reference's chromatic white/blue/amber becomes the brand green,
// with the per-channel offsets kept as a faint fringe and the brightest crossings going
// white-hot, the same chrome-on-black language as the liquid-metal nav.

const FRAG = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 centre;
float random(float x) { return fract(sin(x) * 1e4); }
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y) - centre;
  uv.x = floor(uv.x * 64.0) / 64.0;
  uv.y = floor(uv.y * 128.0) / 128.0;
  float t = time * 0.06 + random(uv.x) * 0.4;
  vec3 c = vec3(0.0);
  for (int j = 0; j < 3; j++)
    for (int i = 0; i < 5; i++)
      c[j] += 0.0008 * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) - length(uv));
  float l = (c.r + c.g + c.b) / 3.0;
  vec3 green = vec3(0.204, 0.733, 0.482);
  vec3 col = green * l * 1.35;
  col += vec3(0.85, 1.0, 0.92) * smoothstep(0.7, 1.6, l);   // white-hot crossings
  col.r += (c.b - c.g) * 0.18;                               // the reference's fringe, faint
  col.b += (c.r - c.g) * 0.22;
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}`
const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'
// The mosaic is 64×128 cells, so rendering finer than half resolution buys nothing visible
// and costs 4× the fragment work. The canvas is stretched back up by CSS.
const RES = 0.5

type Props = { className?: string; reduced?: boolean }

export default function ShaderLines({ className, reduced = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!canvas || !gl) return

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'resolution')
    const uTime = gl.getUniformLocation(prog, 'time')
    const uCentre = gl.getUniformLocation(prog, 'centre')

    let raf = 0, visible = true
    const t0 = performance.now()
    const frame = (now: number) => {
      // Real time, not +0.05 per frame: the reference runs twice as fast on a 120Hz screen.
      gl.uniform1f(uTime, 1 + ((now - t0) / 1000) * 3)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = !reduced && visible ? requestAnimationFrame(frame) : 0
    }
    const size = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RES)), h = Math.max(1, Math.round(canvas.clientHeight * RES))
      canvas.width = w; canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
      // Rings centred on the open right side of the hero on wide screens, so the brightest
      // lines frame the empty half rather than run through the headline.
      gl.uniform2f(uCentre, w > h ? (0.5 * w) / Math.min(w, h) : 0, 0)
      if (!raf) frame(performance.now())
    }
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    // Off-screen, it stops: a full-screen shader is the most expensive thing on the page.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf && !reduced) raf = requestAnimationFrame(frame)
    })
    io.observe(canvas)

    // No loseContext() here: StrictMode re-runs this effect on the same canvas, and a lost
    // context comes back from getContext still lost. The browser frees it with the canvas.
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [reduced])

  return <canvas ref={ref} aria-hidden="true" className={cn('shader-lines', className)} />
}
