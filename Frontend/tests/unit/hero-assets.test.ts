import { describe, expect, it } from 'vitest'

import { checkImageShape, needsAlt, UPLOAD_TARGETS } from '@/features/assets/targets'

describe('bentuk gambar hero', () => {
  const portrait = UPLOAD_TARGETS['hero-portrait']
  const armor = UPLOAD_TARGETS['hero-armor']

  it('menerima ukuran bawaan dan versi yang diskalakan', () => {
    expect(checkImageShape(portrait, 1120, 1100)).toBeNull()
    expect(checkImageShape(portrait, 2240, 2200)).toBeNull()
    expect(checkImageShape(armor, 1280, 1300)).toBeNull()
  })

  it('menolak perbandingan yang melenceng lebih dari 3%', () => {
    expect(checkImageShape(portrait, 1000, 1400)).toMatch(/Perbandingan/)
    expect(checkImageShape(armor, 1600, 1000)).toMatch(/Perbandingan/)
  })

  it('menolak gambar yang terlalu kecil', () => {
    expect(checkImageShape(portrait, 560, 550)).toMatch(/minimal 700/)
    expect(checkImageShape(armor, 640, 650)).toMatch(/minimal 800/)
  })

  it('menolak ukuran yang tidak terbaca', () => {
    expect(checkImageShape(portrait, null, null)).not.toBeNull()
  })

  it('target biasa tidak punya aturan bentuk', () => {
    expect(checkImageShape(UPLOAD_TARGETS['project-cover'], 10, 4000)).toBeNull()
  })

  it('armor hiasan tanpa teks alternatif, potret tetap wajib', () => {
    expect(needsAlt(armor)).toBe(false)
    expect(needsAlt(portrait)).toBe(true)
    expect(needsAlt(UPLOAD_TARGETS['profile-cv'])).toBe(false)
    expect(needsAlt(UPLOAD_TARGETS['project-cover'])).toBe(true)
  })

  it('hanya format yang mendukung latar transparan', () => {
    for (const spec of [portrait, armor]) expect(spec.formats).not.toContain('jpg')
  })
})
