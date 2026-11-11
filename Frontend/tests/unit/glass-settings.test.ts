import { describe, expect, it } from 'vitest'

import { GLASS_DEFAULT, parseGlass } from '@/components/admin/glass-settings'

describe('pengaturan kaca admin', () => {
  it('latar titik diterima, latar kotak commit lama kembali ke bawaan', () => {
    expect(parseGlass(JSON.stringify({ ...GLASS_DEFAULT, bg: 'dots' })).bg).toBe('dots')
    expect(parseGlass(JSON.stringify({ ...GLASS_DEFAULT, bg: 'commit' })).bg).toBe('gradient')
  })

  it('nilai rusak atau di luar batas dikembalikan', () => {
    expect(parseGlass('bukan json')).toEqual(GLASS_DEFAULT)
    expect(parseGlass(JSON.stringify({ blur: 999, opacity: 0, edge: -1 }))).toEqual({
      blur: 40,
      opacity: 0.08,
      edge: 0,
      bg: 'gradient',
    })
  })
})
