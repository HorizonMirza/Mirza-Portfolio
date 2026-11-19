// Alat bantu kanvas 2D untuk grafik kontribusi: membaca warna CSS sebagai RGB, menulis rgb(),
// menguji titik di dalam segi empat, dan menggambar segi empat bersudut bulat.

import type { RGB } from './model'

// Warna CSS apa pun -> sRGB, dengan membiarkan browser melukisnya ke kanvas 1x1.
let probe: CanvasRenderingContext2D | null = null
export const toRGB = (color: string, fallback: RGB | null): RGB | null => {
  if (!probe) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    probe = c.getContext('2d', { willReadFrequently: true })
  }
  if (!probe) return fallback
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = 'rgba(0,0,0,0)'
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const d = probe.getImageData(0, 0, 1, 1).data
  if (d[3] < 8) return fallback
  return [d[0], d[1], d[2]]
}

export const rgbString = (r: number, g: number, b: number) =>
  'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')'

/** Apakah (x, y) berada di dalam segi empat cembung di `p` mulai indeks `o` (4 titik x,y). */
export const pointInQuad = (p: Float32Array, o: number, x: number, y: number): boolean => {
  let sign = 0
  for (let k = 0; k < 4; k++) {
    const ax = p[o + k * 2]
    const ay = p[o + k * 2 + 1]
    const bx = p[o + ((k + 1) % 4) * 2]
    const by = p[o + ((k + 1) % 4) * 2 + 1]
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
    if (Math.abs(cross) < 1e-9) continue
    const s = cross > 0 ? 1 : -1
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return sign !== 0
}

/** Jalur segi empat dari `p` mulai indeks `o`; sudutnya dibulatkan bila radius `r` cukup besar. */
export const quadPath = (ctx: CanvasRenderingContext2D, p: Float32Array, o: number, r: number) => {
  if (r < 0.3) {
    ctx.moveTo(p[o], p[o + 1])
    ctx.lineTo(p[o + 2], p[o + 3])
    ctx.lineTo(p[o + 4], p[o + 5])
    ctx.lineTo(p[o + 6], p[o + 7])
    ctx.closePath()
    return
  }
  ctx.moveTo((p[o + 6] + p[o]) / 2, (p[o + 7] + p[o + 1]) / 2)
  for (let k = 0; k < 4; k++) {
    const b = (k + 1) % 4
    ctx.arcTo(p[o + k * 2], p[o + k * 2 + 1], p[o + b * 2], p[o + b * 2 + 1], r)
  }
  ctx.closePath()
}
