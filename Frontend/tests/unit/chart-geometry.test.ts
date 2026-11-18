import { describe, expect, it } from 'vitest'

import { areaPath, monotonePath, niceTicks, pickTickIndexes, segments } from '@/lib/chart-geometry'

describe('niceTicks', () => {
  it('membuat lima tanda bulat dari 0 yang menutupi nilai maksimum', () => {
    expect(niceTicks(348)).toEqual([0, 100, 200, 300, 400])
    expect(niceTicks(52)).toEqual([0, 20, 40, 60, 80])
    expect(niceTicks(9)).toEqual([0, 5, 10, 15, 20])
  })

  it('tetap bilangan bulat untuk nilai kecil atau kosong', () => {
    expect(niceTicks(0)).toEqual([0, 1, 2, 3, 4])
    expect(niceTicks(3)).toEqual([0, 1, 2, 3, 4])
    for (const max of [0, 1, 7, 99, 100, 101, 1234, 98765]) {
      const ticks = niceTicks(max)
      expect(ticks).toHaveLength(5)
      expect(ticks.every(Number.isInteger)).toBe(true)
      expect(ticks[4]).toBeGreaterThanOrEqual(max)
    }
  })
})

describe('pickTickIndexes', () => {
  it('menampilkan semua label bila muat', () => {
    expect(pickTickIndexes(5, 800, 80)).toEqual([0, 1, 2, 3, 4])
  })

  it('selalu memuat titik pertama dan terakhir dengan jarak minimal terjaga', () => {
    const width = 700
    const minGap = 90
    for (const count of [7, 30, 90, 91]) {
      const idx = pickTickIndexes(count, width, minGap)
      expect(idx[0]).toBe(0)
      expect(idx[idx.length - 1]).toBe(count - 1)
      const px = (i: number) => (i * width) / (count - 1)
      for (let i = 1; i < idx.length; i++)
        expect(px(idx[i]) - px(idx[i - 1])).toBeGreaterThanOrEqual(minGap * 0.8)
    }
  })

  it('menangani nol dan satu titik', () => {
    expect(pickTickIndexes(0, 500, 80)).toEqual([])
    expect(pickTickIndexes(1, 500, 80)).toEqual([0])
  })
})

describe('monotonePath', () => {
  const parse = (d: string) =>
    d
      .split('C')
      .slice(1)
      .map((s) => s.split(',').map(Number))

  it('tidak melampaui nilai data di antara dua titik (tanpa lembah palsu)', () => {
    const pts = [
      { x: 0, y: 100 },
      { x: 10, y: 100 },
      { x: 20, y: 20 },
      { x: 30, y: 100 },
      { x: 40, y: 100 },
    ]
    parse(monotonePath(pts)).forEach((seg, i) => {
      const lo = Math.min(pts[i].y, pts[i + 1].y)
      const hi = Math.max(pts[i].y, pts[i + 1].y)
      expect(seg[1]).toBeGreaterThanOrEqual(lo - 1e-9)
      expect(seg[1]).toBeLessThanOrEqual(hi + 1e-9)
      expect(seg[3]).toBeGreaterThanOrEqual(lo - 1e-9)
      expect(seg[3]).toBeLessThanOrEqual(hi + 1e-9)
    })
  })

  it('menangani 0, 1, dan 2 titik', () => {
    expect(monotonePath([])).toBe('')
    expect(monotonePath([{ x: 1, y: 2 }])).toBe('M1,2')
    expect(
      monotonePath([
        { x: 0, y: 0 },
        { x: 3, y: 3 },
      ]).startsWith('M0,0C'),
    ).toBe(true)
  })

  it('area ditutup ke sumbu bawah', () => {
    const d = areaPath(
      [
        { x: 0, y: 5 },
        { x: 10, y: 1 },
      ],
      20,
    )
    expect(d.endsWith('L10,20L0,20Z')).toBe(true)
    expect(areaPath([{ x: 0, y: 5 }], 20)).toBe('')
  })
})

describe('segments', () => {
  it('memecah di nilai kosong', () => {
    expect(segments([1, 2, null, 3, null, null, 4, 5, 6])).toEqual([
      { start: 0, items: [1, 2] },
      { start: 3, items: [3] },
      { start: 6, items: [4, 5, 6] },
    ])
  })
})
