// Simulasi cairan kecil (WebGL2) untuk masker hover hero, seperti komponen "Crazy Hover Mask Reveal"
// (Framer University/OFF+BRAND) yang diminta pemilik 2026-10-20: kursor meninggalkan "percikan" zat
// warna yang ikut terbawa aliran, berpusar (vortisitas), lalu memudar. Zat warna itu dipakai sebagai
// masker bertepi tajam (ambang + sedikit butiran) untuk membuka lapisan armor.
// Algoritma "stable fluids" (Jos Stam): advection, curl/vorticity, divergence, tekanan (Jacobi),
// pengurangan gradien. Ditulis sendiri tanpa library. Tanpa WebGL2 + render ke float 16 bit, fungsi
// ini mengembalikan null dan hero memakai masker kabut canvas 2D.

// resolusi kecepatan (sisi pendek) dan zat warna (terhadap piksel CSS)
const SIM_SHORT = 128
const DYE_SCALE = 0.5
const DYE_LONG_MAX = 1024
const PRESSURE_ITERATIONS = 18
// ambang tepi masker dan lebar peralihan (dalam satuan kepekatan zat warna)
const EDGE = 0.3
const EDGE_SOFT = 0.035
// kepekatan puncak satu percikan: di atas 1 agar bagian tengah jejak bertahan sedikit lebih lama
// daripada tepinya, sehingga jejak menyusut dari tepi (bukan hilang serentak)
const PEAK = 1.5
// redaman kecepatan per detik: aliran cepat tenang agar jejak tidak meregang lalu menipis
const VELOCITY_DISSIPATION = 2.5

export type FluidOptions = {
  // detik sampai satu percikan penuh hilang
  life: number
  // kekuatan pusaran (0 = tanpa pusaran)
  swirl: number
  // butiran di tepi masker
  grain: number
}

export type HeroFluid = {
  resize: (width: number, height: number, dpr: number) => void
  // titik dan jari-jari dalam piksel CSS; kecepatan dalam piksel CSS per detik
  splat: (x: number, y: number, radius: number, vx: number, vy: number) => void
  setLayer: (source: TexImageSource) => void
  step: (dt: number) => void
  render: () => void
  clear: () => void
  setOptions: (options: Partial<FluidOptions>) => void
  dispose: () => void
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const head = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uTexel;
`

const SPLAT = `${head}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform float uRadius;
uniform vec3 uValue;
uniform float uCap;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 add = exp(-dot(p, p) / uRadius) * uValue;
  vec3 base = texture(uTarget, vUv).xyz;
  // zat warna dibatasi uCap agar percikan yang bertumpuk tidak membesar; kecepatan tidak dibatasi
  outColor = vec4(min(base + add, vec3(uCap)), 1.0);
}`

const ADVECT = `${head}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  outColor = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`

const CURL = `${head}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  outColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`

const VORTICITY = `${head}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`

const DIVERGENCE = `${head}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`

const PRESSURE = `${head}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float d = texture(uDivergence, vUv).x;
  outColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`

const GRADIENT = `${head}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
  outColor = vec4(v, 0.0, 1.0);
}`

const FADE = `${head}
uniform sampler2D uSource;
uniform float uFactor;
void main() {
  outColor = texture(uSource, vUv) * uFactor;
}`

// Tampilan: lapisan armor (premultiplied) dikali masker dari zat warna. Butiran memakai derau nilai
// yang diam (tidak berkedip) sekitar 3 px, sehingga tepi terlihat bertekstur seperti referensi.
const DISPLAY = `${head}
uniform sampler2D uDye;
uniform sampler2D uLayer;
uniform float uEdge;
uniform float uSoft;
uniform float uGrain;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float d = texture(uDye, vUv).x;
  float n = noise(gl_FragCoord.xy / 3.0) - 0.5;
  float e = uEdge + n * uGrain;
  float a = smoothstep(e - uSoft, e + uSoft, d);
  outColor = texture(uLayer, vUv) * a;
}`

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
type Double = { read: Target; write: Target; swap: () => void }

export function createHeroFluid(
  canvas: HTMLCanvasElement,
  initial: FluidOptions,
): HeroFluid | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null
  // render ke tekstur float 16 bit (EXT_color_buffer_float mencakup 16F di WebGL2)
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float'))
    return null
  const options = { ...initial }

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('shader')
    return shader
  }
  let vert: WebGLShader
  try {
    vert = compile(gl.VERTEX_SHADER, VERT)
  } catch {
    return null
  }
  type Program = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }
  const program = (source: string): Program => {
    const p = gl.createProgram()!
    gl.attachShader(p, vert)
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, source))
    gl.bindAttribLocation(p, 0, 'aPos')
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link')
    const u: Program['u'] = {}
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(p, i)!.name
      u[name] = gl.getUniformLocation(p, name)
    }
    return { program: p, u }
  }
  let P: Record<
    | 'splat'
    | 'advect'
    | 'curl'
    | 'vorticity'
    | 'divergence'
    | 'pressure'
    | 'gradient'
    | 'fade'
    | 'display',
    Program
  >
  try {
    P = {
      splat: program(SPLAT),
      advect: program(ADVECT),
      curl: program(CURL),
      vorticity: program(VORTICITY),
      divergence: program(DIVERGENCE),
      pressure: program(PRESSURE),
      gradient: program(GRADIENT),
      fade: program(FADE),
      display: program(DISPLAY),
    }
  } catch {
    return null
  }

  // satu segitiga besar menutupi layar
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const target = (w: number, h: number, internal: number, format: number): Target => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fbo, w, h }
  }
  const double = (w: number, h: number, internal: number, format: number): Double => {
    const d = {
      read: target(w, h, internal, format),
      write: target(w, h, internal, format),
      swap() {
        const t = d.read
        d.read = d.write
        d.write = t
      },
    }
    return d
  }
  const free = (t: Target) => {
    gl.deleteTexture(t.tex)
    gl.deleteFramebuffer(t.fbo)
  }

  let velocity: Double | null = null
  let dye: Double | null = null
  let pressure: Double | null = null
  let divergence: Target | null = null
  let curl: Target | null = null
  let cssW = 1
  let cssH = 1

  const layer = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, layer)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))

  let unit = 0
  const bind = (tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    return unit++
  }
  const pass = (p: Program, out: Target | null, texel?: Target) => {
    unit = 0
    gl.useProgram(p.program)
    const w = out ? out.w : canvas.width
    const h = out ? out.h : canvas.height
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null)
    gl.viewport(0, 0, w, h)
    const t = texel ?? out
    if (p.u.uTexel && t) gl.uniform2f(p.u.uTexel, 1 / t.w, 1 / t.h)
    return p.u
  }
  const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3)

  const resize = (width: number, height: number, dpr: number) => {
    cssW = Math.max(1, width)
    cssH = Math.max(1, height)
    canvas.width = Math.max(1, Math.round(cssW * dpr))
    canvas.height = Math.max(1, Math.round(cssH * dpr))
    const short = Math.min(cssW, cssH)
    const simW = Math.max(16, Math.round((SIM_SHORT * cssW) / short))
    const simH = Math.max(16, Math.round((SIM_SHORT * cssH) / short))
    const k = Math.min(DYE_SCALE, DYE_LONG_MAX / Math.max(cssW, cssH))
    const dyeW = Math.max(16, Math.round(cssW * k))
    const dyeH = Math.max(16, Math.round(cssH * k))
    for (const d of [velocity, dye, pressure]) {
      if (d) {
        free(d.read)
        free(d.write)
      }
    }
    for (const t of [divergence, curl]) if (t) free(t)
    velocity = double(simW, simH, gl.RG16F, gl.RG)
    pressure = double(simW, simH, gl.R16F, gl.RED)
    divergence = target(simW, simH, gl.R16F, gl.RED)
    curl = target(simW, simH, gl.R16F, gl.RED)
    dye = double(dyeW, dyeH, gl.R16F, gl.RED)
  }

  const splat = (x: number, y: number, radius: number, vx: number, vy: number) => {
    if (!velocity || !dye) return
    const point: [number, number] = [x / cssW, 1 - y / cssH]
    // jari-jari Gauss dalam satuan tinggi; kontur pada ambang EDGE = radius piksel CSS
    const r = radius / cssH / Math.sqrt(Math.log(PEAK / EDGE))
    const aspect = cssW / cssH
    // kecepatan piksel CSS/detik -> sel simulasi/detik
    const sx = velocity.read.w / cssW
    const sy = velocity.read.h / cssH
    let u = pass(P.splat, velocity.write)
    gl.uniform1i(u.uTarget!, bind(velocity.read.tex))
    gl.uniform1f(u.uAspect!, aspect)
    gl.uniform2f(u.uPoint!, point[0], point[1])
    gl.uniform1f(u.uRadius!, r * r)
    gl.uniform3f(u.uValue!, vx * sx, -vy * sy, 0)
    gl.uniform1f(u.uCap!, 1e4)
    draw()
    velocity.swap()
    u = pass(P.splat, dye.write)
    gl.uniform1i(u.uTarget!, bind(dye.read.tex))
    gl.uniform1f(u.uAspect!, aspect)
    gl.uniform2f(u.uPoint!, point[0], point[1])
    gl.uniform1f(u.uRadius!, r * r)
    gl.uniform3f(u.uValue!, PEAK, 0, 0)
    gl.uniform1f(u.uCap!, PEAK)
    draw()
    dye.swap()
  }

  const step = (dt: number) => {
    if (!velocity || !dye || !pressure || !divergence || !curl) return
    gl.disable(gl.BLEND)
    let u = pass(P.curl, curl)
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    draw()
    u = pass(P.vorticity, velocity.write)
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    gl.uniform1i(u.uCurl!, bind(curl.tex))
    gl.uniform1f(u.uCurlStrength!, options.swirl)
    gl.uniform1f(u.uDt!, dt)
    draw()
    velocity.swap()
    u = pass(P.divergence, divergence)
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    draw()
    // tekanan sebelumnya dikurangi agar konvergen lebih cepat
    u = pass(P.fade, pressure.write)
    gl.uniform1i(u.uSource!, bind(pressure.read.tex))
    gl.uniform1f(u.uFactor!, 0.8)
    draw()
    pressure.swap()
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      u = pass(P.pressure, pressure.write)
      gl.uniform1i(u.uPressure!, bind(pressure.read.tex))
      gl.uniform1i(u.uDivergence!, bind(divergence.tex))
      draw()
      pressure.swap()
    }
    u = pass(P.gradient, velocity.write)
    gl.uniform1i(u.uPressure!, bind(pressure.read.tex))
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    draw()
    velocity.swap()
    // kecepatan cepat reda (aliran tenang setelah kursor berhenti); zat warna hilang dalam `life` detik
    u = pass(P.advect, velocity.write)
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    gl.uniform1i(u.uSource!, bind(velocity.read.tex))
    gl.uniform2f(u.uSimTexel!, 1 / velocity.read.w, 1 / velocity.read.h)
    gl.uniform1f(u.uDt!, dt)
    gl.uniform1f(u.uDissipation!, VELOCITY_DISSIPATION)
    draw()
    velocity.swap()
    u = pass(P.advect, dye.write)
    gl.uniform1i(u.uVelocity!, bind(velocity.read.tex))
    gl.uniform1i(u.uSource!, bind(dye.read.tex))
    gl.uniform2f(u.uSimTexel!, 1 / velocity.read.w, 1 / velocity.read.h)
    gl.uniform1f(u.uDt!, dt)
    // 1/(1+k·dt) per bingkai ≈ e^(-k·t): titik berkepekatan 1 turun ke ambang EDGE setelah `life`
    // detik; inti percikan (PEAK) bertahan sedikit lebih lama
    gl.uniform1f(u.uDissipation!, Math.log(1 / EDGE) / Math.max(0.05, options.life))
    draw()
    dye.swap()
  }

  const render = () => {
    if (!dye) return
    const u = pass(P.display, null)
    gl.uniform1i(u.uDye!, bind(dye.read.tex))
    gl.uniform1i(u.uLayer!, bind(layer))
    gl.uniform1f(u.uEdge!, EDGE)
    gl.uniform1f(u.uSoft!, EDGE_SOFT)
    gl.uniform1f(u.uGrain!, options.grain)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    draw()
  }

  const clear = () => {
    for (const d of [velocity, dye, pressure]) {
      if (!d) continue
      for (const t of [d.read, d.write]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  const setLayer = (source: TexImageSource) => {
    gl.bindTexture(gl.TEXTURE_2D, layer)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  }

  const dispose = () => {
    for (const d of [velocity, dye, pressure]) {
      if (d) {
        free(d.read)
        free(d.write)
      }
    }
    for (const t of [divergence, curl]) if (t) free(t)
    gl.deleteTexture(layer)
    gl.deleteBuffer(buffer)
    for (const p of Object.values(P)) gl.deleteProgram(p.program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  return {
    resize,
    splat,
    setLayer,
    step,
    render,
    clear,
    setOptions: (next) => Object.assign(options, next),
    dispose,
  }
}
