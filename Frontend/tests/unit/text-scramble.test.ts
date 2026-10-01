import { describe, expect, it } from 'vitest'

import { scrambleFrame } from '@/lib/text-scramble'

describe('scrambleFrame', () => {
  const target = 'Halo, dunia 2026!'

  it('selesai tepat pada teks tujuan', () => {
    expect(scrambleFrame(target, 1, () => '#')).toBe(target)
  })

  it('di awal semua huruf dan angka diacak, spasi dan tanda baca tetap', () => {
    expect(scrambleFrame(target, 0, () => '#')).toBe('####, ##### ####!')
  })

  it('huruf terkunci dari kiri ke kanan', () => {
    const mid = scrambleFrame(target, 0.5, () => '#')
    expect(mid.startsWith('Halo, ')).toBe(true)
    expect(mid.endsWith('####!')).toBe(true)
    expect(mid).toHaveLength(target.length)
  })
})
