import { describe, expect, it } from 'vitest'

import { introSchema, soundSchema } from '@/features/settings/schema'

const intro = {
  introEnabled: true,
  introTitle_id: 'Sebelum masuk',
  introTitle_en: 'Before you enter',
  introBody_id: 'Isi singkat.',
  introBody_en: 'Short text.',
}

describe('soundSchema', () => {
  it('volume 0 sampai 100 diterima', () => {
    expect(soundSchema.safeParse({ soundVolume: 0 }).success).toBe(true)
    expect(soundSchema.safeParse({ soundVolume: 100 }).success).toBe(true)
  })

  it('di luar rentang, pecahan, atau bukan angka ditolak', () => {
    expect(soundSchema.safeParse({ soundVolume: -5 }).success).toBe(false)
    expect(soundSchema.safeParse({ soundVolume: 101 }).success).toBe(false)
    expect(soundSchema.safeParse({ soundVolume: 12.5 }).success).toBe(false)
    expect(soundSchema.safeParse({ soundVolume: Number.NaN }).success).toBe(false)
    expect(soundSchema.safeParse({ soundVolume: '50' }).success).toBe(false)
  })
})

describe('introSchema', () => {
  it('pemberitahuan pembuka aktif wajib berisi judul dan isi dua bahasa', () => {
    expect(introSchema.safeParse({ ...intro, introBody_en: '' }).success).toBe(false)
    expect(introSchema.safeParse({ ...intro, introTitle_id: '  ' }).success).toBe(false)
  })

  it('pemberitahuan pembuka mati boleh kosong, isi terlalu panjang ditolak', () => {
    const empty = { introTitle_id: '', introTitle_en: '', introBody_id: '', introBody_en: '' }
    expect(introSchema.safeParse({ introEnabled: false, ...empty }).success).toBe(true)
    expect(introSchema.safeParse({ ...intro, introBody_id: 'a'.repeat(601) }).success).toBe(false)
  })
})
