// Tes unit Backend/features/assets/targets: maxSideOf, needsAlt, dan daftar tujuan unggahan.

import { describe, expect, it } from 'vitest'

import {
  maxSideOf,
  needsAlt,
  UPLOAD_TARGET_KEYS,
  UPLOAD_TARGETS,
} from '@backend/features/assets/targets'

// ukuran gambar ditulis per tujuan, bukan ditebak dari batas berkas
describe('maxSideOf', () => {
  it('tiap tujuan gambar punya maxSide sendiri', () => {
    for (const key of UPLOAD_TARGET_KEYS) expect(maxSideOf(key), key).toBeGreaterThanOrEqual(256)
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

describe('tujuan unggahan', () => {
  it('foto wajib teks alternatif, logo hiasan tidak', () => {
    expect(needsAlt(UPLOAD_TARGETS['project-cover'])).toBe(true)
    expect(needsAlt(UPLOAD_TARGETS['profile-photo'])).toBe(true)
    expect(needsAlt(UPLOAD_TARGETS['skill-logo'])).toBe(false)
    expect(needsAlt(UPLOAD_TARGETS['about-chip-logo'])).toBe(false)
  })
  it('foto utama beranda dan CV tidak bisa diunggah (foto dari repo, CV berupa link)', () => {
    expect(UPLOAD_TARGET_KEYS).not.toContain('hero-portrait')
    expect(UPLOAD_TARGET_KEYS).not.toContain('profile-cv')
    expect(UPLOAD_TARGET_KEYS).not.toContain('hero-armor')
  })
})
