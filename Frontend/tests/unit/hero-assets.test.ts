import { describe, expect, it } from 'vitest'

import { checkImageShape, needsAlt, UPLOAD_TARGETS } from '@/features/assets/targets'

// Foto utama beranda; armor hero tidak bisa diunggah lagi sejak 2026-11-10 (selalu gambar bawaan).
describe('bentuk foto utama beranda', () => {
  const portrait = UPLOAD_TARGETS['hero-portrait']

  it('menerima ukuran bawaan dan versi yang diskalakan', () => {
    expect(checkImageShape(portrait, 1120, 1100)).toBeNull()
    expect(checkImageShape(portrait, 2240, 2200)).toBeNull()
  })

  it('menolak perbandingan yang melenceng lebih dari 3%', () => {
    expect(checkImageShape(portrait, 1000, 1400)).toMatch(/Perbandingan/)
  })

  it('menolak gambar yang terlalu kecil', () => {
    expect(checkImageShape(portrait, 560, 550)).toMatch(/minimal 700/)
  })

  it('menolak ukuran yang tidak terbaca', () => {
    expect(checkImageShape(portrait, null, null)).not.toBeNull()
  })

  it('target biasa tidak punya aturan bentuk', () => {
    expect(checkImageShape(UPLOAD_TARGETS['project-cover'], 10, 4000)).toBeNull()
  })

  it('foto utama wajib teks alternatif, CV tidak', () => {
    expect(needsAlt(portrait)).toBe(true)
    expect(needsAlt(UPLOAD_TARGETS['profile-cv'])).toBe(false)
    expect(needsAlt(UPLOAD_TARGETS['project-cover'])).toBe(true)
  })

  it('hanya format yang mendukung latar transparan', () => {
    expect(portrait.formats).not.toContain('jpg')
  })

  it('armor hero bukan target unggahan lagi', () => {
    expect('hero-armor' in UPLOAD_TARGETS).toBe(false)
  })
})
