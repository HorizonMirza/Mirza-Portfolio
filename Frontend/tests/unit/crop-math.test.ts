import { describe, expect, it } from 'vitest'

import {
  aspectChoices,
  clampOffset,
  coverScale,
  effectiveSize,
  exportSize,
} from '@/features/assets/crop-math'

describe('pemotong gambar', () => {
  it('putaran 90/270 menukar lebar dan tinggi', () => {
    expect(effectiveSize(400, 300, 0)).toEqual({ w: 400, h: 300 })
    expect(effectiveSize(400, 300, 90)).toEqual({ w: 300, h: 400 })
    expect(effectiveSize(400, 300, 180)).toEqual({ w: 400, h: 300 })
    expect(effectiveSize(400, 300, 270)).toEqual({ w: 300, h: 400 })
  })

  it('zoom 1 menutupi seluruh bingkai', () => {
    // gambar lebar 1000x500 di bingkai persegi 200x200: tinggi yang menentukan
    expect(coverScale(1000, 500, 200, 200)).toBeCloseTo(0.4)
    // bingkai lebih lebar dari gambar: lebar yang menentukan
    expect(coverScale(300, 600, 300, 150)).toBeCloseTo(1)
  })

  it('geser dibatasi agar bingkai tidak keluar dari gambar', () => {
    const scale = coverScale(1000, 500, 200, 200) // gambar jadi 400x200
    expect(clampOffset({ x: 999, y: 999 }, 1000, 500, scale, 200, 200)).toEqual({ x: 100, y: 0 })
    expect(clampOffset({ x: -999, y: 5 }, 1000, 500, scale, 200, 200)).toEqual({ x: -100, y: 0 })
    // diperbesar 2x: ruang geser bertambah
    expect(clampOffset({ x: 999, y: 999 }, 1000, 500, scale * 2, 200, 200)).toEqual({
      x: 300,
      y: 100,
    })
  })

  it('ukuran hasil memakai resolusi asli dan dibatasi sisi terpanjang', () => {
    // bingkai 200x200 pada skala 0,4: bagian asli 500x500
    expect(exportSize(200, 200, 0.4, 2000)).toEqual({ width: 500, height: 500 })
    // dibatasi 512 untuk logo
    expect(exportSize(200, 200, 0.4, 512)).toEqual({ width: 500, height: 500 })
    expect(exportSize(200, 100, 0.05, 512)).toEqual({ width: 512, height: 256 })
  })

  it('pilihan perbandingan: tempat dulu, tanpa ganda, tetap bila terkunci', () => {
    const square = aspectChoices(1, false).map((c) => c.key)
    expect(square[0]).toBe('default')
    expect(square).not.toContain('1:1')
    expect(square).toContain('original')
    expect(aspectChoices(1120 / 1100, true)).toHaveLength(1)
    expect(aspectChoices(undefined, false).length).toBeGreaterThan(3)
  })
})
