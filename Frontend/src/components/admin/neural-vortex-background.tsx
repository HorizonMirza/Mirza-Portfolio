'use client'

import { useEffect, useRef } from 'react'

// Latar halaman login admin: shader "neural vortex" (WebGL, tanpa library). Cahaya mengikuti
// kursor/sentuhan. Berhenti saat tab tersembunyi, satu bingkai diam bila prefers-reduced-motion.
// Tanpa WebGL: canvas kosong, latar hitam tetap tampil.

const VERTEX = `
precision mediump float;
attribute vec2 a_position;
varying vec2 vUv;
void main() {
  vUv = .5 * (a_position + 1.);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform float u_time;
uniform float u_ratio;
uniform vec2 u_pointer_position;

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float neuro_shape(vec2 uv, float t, float p) {
  vec2 sine_acc = vec2(0.);
  vec2 res = vec2(0.);
  float scale = 8.;
  for (int j = 0; j < 15; j++) {
    uv = rotate(uv, 1.);
    sine_acc = rotate(sine_acc, 1.);
    vec2 layer = uv * scale + float(j) + sine_acc - t;
    sine_acc += sin(layer) + 2.4 * p;
    res += (.5 + .5 * cos(layer)) / scale;
    scale *= 1.2;
  }
  return res.x + res.y;
}

void main() {
  vec2 uv = .5 * vUv;
  uv.x *= u_ratio;
  vec2 pointer = vUv - u_pointer_position;
  pointer.x *= u_ratio;
  float p = clamp(length(pointer), 0., 1.);
  p = .5 * pow(1. - p, 2.);
  float t = .001 * u_time;
  float noise = neuro_shape(uv, t, p);
  noise = 1.2 * pow(noise, 3.);
  noise += pow(noise, 10.);
  noise = max(.0, noise - .5);
  noise *= (1. - length(vUv - .5));
  vec3 color = vec3(0.5, 0.15, 0.65);
  color = mix(color, vec3(0.02, 0.7, 0.9), 0.32 + 0.16 * sin(1.2));
  color += vec3(0.15, 0.0, 0.6) * sin(1.5);
  color = color * noise;
  gl_FragColor = vec4(color, noise);
}
`

function compile(gl: WebGLRenderingContext, source: string, type: number) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function NeuralVortexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { premultipliedAlpha: false, antialias: false })
    if (!canvas || !gl) return

    const vertex = compile(gl, VERTEX, gl.VERTEX_SHADER)
    const fragment = compile(gl, FRAGMENT, gl.FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRatio = gl.getUniformLocation(program, 'u_ratio')
    const uPointer = gl.getUniformLocation(program, 'u_pointer_position')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, tX: 0, tY: 0 }
    pointer.tX = pointer.x
    pointer.tY = pointer.y
    let frame = 0

    const draw = (time: number) => {
      pointer.x += (pointer.tX - pointer.x) * 0.2
      pointer.y += (pointer.tY - pointer.y) * 0.2
      gl.uniform1f(uTime, time)
      gl.uniform2f(uPointer, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const resize = () => {
      // DPR dibatasi agar shader 15 lapis tetap ringan di layar besar
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uRatio, canvas.width / canvas.height)
      if (reduceMotion) draw(20000)
    }

    const loop = (time: number) => {
      draw(time)
      frame = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!reduceMotion && !frame && document.visibilityState === 'visible') {
        frame = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())
    const onPointer = (event: PointerEvent) => {
      pointer.tX = event.clientX
      pointer.tY = event.clientY
    }

    resize()
    start()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 size-full opacity-95"
    />
  )
}
