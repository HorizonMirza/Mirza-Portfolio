// Tes unit src/features/assets/file-type: resolveMime.

import { describe, expect, it } from 'vitest'

import { resolveMime } from '@/features/assets/file-type'

// tipe kosong dari browser tidak boleh menolak format yang diizinkan
describe('resolveMime', () => {
  it('memakai tipe dari browser bila ada', () => {
    expect(resolveMime('foto.avif', 'image/avif')).toBe('image/avif')
    expect(resolveMime('foto.png', 'image/webp')).toBe('image/webp')
  })
  it('tipe kosong diturunkan dari ekstensi, tanpa membedakan huruf besar', () => {
    expect(resolveMime('logo.avif', '')).toBe('image/avif')
    expect(resolveMime('LOGO.AVIF', '')).toBe('image/avif')
    expect(resolveMime('a.b.jpeg', '')).toBe('image/jpeg')
  })
  it('ekstensi tidak dikenal atau tanpa ekstensi tetap kosong (ditolak)', () => {
    expect(resolveMime('skrip.exe', '')).toBe('')
    expect(resolveMime('avif', '')).toBe('')
    expect(resolveMime('', '')).toBe('')
  })
})
