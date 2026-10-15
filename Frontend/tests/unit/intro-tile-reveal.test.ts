import { describe, expect, it } from 'vitest'

import { TILE_SPREAD_MS, tileDelays } from '@/features/settings/components/public/intro-tile-reveal'

describe('tileDelays', () => {
  it('kotak terdekat dari tombol hilang lebih dulu, terjauh paling akhir', () => {
    // 4 x 3 kotak 10 px, asal di tengah kotak kanan bawah
    const delays = tileDelays(4, 3, 10, { x: 35, y: 25 })
    expect(delays).toHaveLength(12)
    expect(delays[11]).toBe(0)
    expect(Math.max(...delays)).toBe(delays[0])
    expect(delays[0]).toBeLessThanOrEqual(TILE_SPREAD_MS)
    expect(delays[0]).toBeGreaterThan(TILE_SPREAD_MS * 0.8)
  })

  it('jeda tidak pernah negatif dan tidak melebihi rentang sebar', () => {
    const delays = tileDelays(30, 17, 64, { x: 1200, y: 700 })
    expect(Math.min(...delays)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...delays)).toBeLessThanOrEqual(TILE_SPREAD_MS)
  })
})
