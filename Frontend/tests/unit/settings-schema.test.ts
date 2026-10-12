import { describe, expect, it } from 'vitest'

import { settingsSchema } from '@/features/settings/schema'

const intro = {
  introEnabled: true,
  introTitle_id: 'Sebelum masuk',
  introTitle_en: 'Before you enter',
  introBody_id: 'Isi singkat.',
  introBody_en: 'Short text.',
}

describe('settingsSchema', () => {
  it('volume 0 sampai 100 diterima', () => {
    expect(settingsSchema.safeParse({ ...intro, soundVolume: 0 }).success).toBe(true)
    expect(settingsSchema.safeParse({ ...intro, soundVolume: 100 }).success).toBe(true)
  })

  it('di luar rentang, pecahan, atau bukan angka ditolak', () => {
    expect(settingsSchema.safeParse({ ...intro, soundVolume: -5 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...intro, soundVolume: 101 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...intro, soundVolume: 12.5 }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...intro, soundVolume: Number.NaN }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...intro, soundVolume: '50' }).success).toBe(false)
  })

  it('pemberitahuan pembuka aktif wajib berisi judul dan isi dua bahasa', () => {
    expect(settingsSchema.safeParse({ ...intro, soundVolume: 80, introBody_en: '' }).success).toBe(
      false,
    )
    expect(
      settingsSchema.safeParse({ ...intro, soundVolume: 80, introTitle_id: '  ' }).success,
    ).toBe(false)
  })

  it('pemberitahuan pembuka mati boleh kosong, isi terlalu panjang ditolak', () => {
    const empty = { introTitle_id: '', introTitle_en: '', introBody_id: '', introBody_en: '' }
    expect(
      settingsSchema.safeParse({ soundVolume: 80, introEnabled: false, ...empty }).success,
    ).toBe(true)
    expect(
      settingsSchema.safeParse({ ...intro, soundVolume: 80, introBody_id: 'a'.repeat(601) })
        .success,
    ).toBe(false)
  })
})
