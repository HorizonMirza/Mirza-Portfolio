import { describe, expect, it } from 'vitest'

import { DEFAULT_SITE_OPTIONS, siteOptionSchema, toSiteOptions } from '@/features/settings/options'
import { introSchema } from '@/features/settings/schema'

const intro = { introBody_id: 'Isi singkat.', introBody_en: 'Short text.' }

const ok = (input: unknown) => siteOptionSchema.safeParse(input).success

describe('siteOptionSchema', () => {
  it('volume 0 sampai 100 diterima', () => {
    expect(ok({ key: 'soundVolume', value: 0 })).toBe(true)
    expect(ok({ key: 'soundVolume', value: 100 })).toBe(true)
  })

  it('volume di luar rentang, pecahan, atau bukan angka ditolak', () => {
    for (const value of [-5, 101, 12.5, Number.NaN, '50'])
      expect(ok({ key: 'soundVolume', value })).toBe(false)
  })

  it('pilihan teks hanya dari daftar', () => {
    expect(ok({ key: 'defaultTheme', value: 'system' })).toBe(true)
    expect(ok({ key: 'defaultTheme', value: 'blue' })).toBe(false)
    expect(ok({ key: 'defaultLocale', value: 'en' })).toBe(true)
    expect(ok({ key: 'defaultLocale', value: 'fr' })).toBe(false)
    expect(ok({ key: 'introFrequency', value: 'weekly' })).toBe(true)
    expect(ok({ key: 'introFrequency', value: 'daily' })).toBe(false)
  })

  it('batas pesan per jam 1 sampai 50, masa simpan hanya 30, 90, atau 365 hari', () => {
    expect(ok({ key: 'contactPerHour', value: 1 })).toBe(true)
    expect(ok({ key: 'contactPerHour', value: 0 })).toBe(false)
    expect(ok({ key: 'contactPerHour', value: 51 })).toBe(false)
    expect(ok({ key: 'visitRetentionDays', value: 365 })).toBe(true)
    expect(ok({ key: 'visitRetentionDays', value: 60 })).toBe(false)
  })

  it('saklar hanya boolean, kolom lain di SiteSetting tidak bisa ditulis', () => {
    expect(ok({ key: 'maintenanceMode', value: true })).toBe(true)
    expect(ok({ key: 'maintenanceMode', value: 'true' })).toBe(false)
    expect(ok({ key: 'heroPortraitId', value: 'x' })).toBe(false)
    expect(ok({ key: 'introBody_id', value: 'x' })).toBe(false)
  })
})

describe('toSiteOptions', () => {
  it('baris kosong memakai bawaan', () => {
    expect(toSiteOptions(null)).toEqual(DEFAULT_SITE_OPTIONS)
  })

  it('isi tidak dikenal dari database kembali ke bawaan', () => {
    const v = toSiteOptions({ defaultTheme: 'ungu', contactPerHour: 999, visitRetentionDays: 7 })
    expect(v.defaultTheme).toBe('dark')
    expect(v.contactPerHour).toBe(5)
    expect(v.visitRetentionDays).toBe(90)
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
