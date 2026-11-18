import { describe, expect, it } from 'vitest'

import { maxSideOf, UPLOAD_TARGET_KEYS, UPLOAD_TARGETS } from '@backend/features/assets/targets'

// audit 2026-11-17, EFF-05: ukuran gambar ditulis per tujuan, bukan ditebak dari batas berkas
describe('maxSideOf', () => {
  it('tiap tujuan gambar punya maxSide sendiri', () => {
    for (const key of UPLOAD_TARGET_KEYS) {
      const spec = UPLOAD_TARGETS[key]
      if (spec.kind !== 'IMAGE') continue
      expect('maxSide' in spec, key).toBe(true)
      expect(maxSideOf(key), key).toBeGreaterThanOrEqual(256)
    }
  })
  it('logo 512, foto 2000, foto kartu ID 1024', () => {
    expect(maxSideOf('skill-logo')).toBe(512)
    expect(maxSideOf('experience-logo')).toBe(512)
    expect(maxSideOf('about-chip-logo')).toBe(512)
    expect(maxSideOf('profile-photo')).toBe(2000)
    expect(maxSideOf('about-photo')).toBe(2000)
    expect(maxSideOf('project-cover')).toBe(2000)
    expect(maxSideOf('contact-photo')).toBe(1024)
  })
  it('mengubah batas berkas tidak mengubah ukuran gambar', () => {
    // foto kartu ID berbatas 2 MB tetapi bukan logo
    expect(UPLOAD_TARGETS['contact-photo'].maxBytes).toBe(2 * 1024 * 1024)
    expect(maxSideOf('contact-photo')).not.toBe(512)
  })
})
