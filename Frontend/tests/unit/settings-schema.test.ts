import { describe, expect, it } from 'vitest'

import { introSchema, soundSchema } from '@/features/settings/schema'

const intro = { introBody_id: 'Isi singkat.', introBody_en: 'Short text.' }

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
  // sejak 2026-11-10 hanya isi kartu pembuka yang bisa diubah; judul dan saklar tampil dihapus
  it('isi dua bahasa wajib diisi', () => {
    expect(introSchema.safeParse(intro).success).toBe(true)
    expect(introSchema.safeParse({ ...intro, introBody_en: '' }).success).toBe(false)
    expect(introSchema.safeParse({ ...intro, introBody_id: '   ' }).success).toBe(false)
  })

  it('isi terlalu panjang ditolak', () => {
    expect(introSchema.safeParse({ ...intro, introBody_id: 'a'.repeat(601) }).success).toBe(false)
  })
})
