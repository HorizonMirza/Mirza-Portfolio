import { describe, expect, it } from 'vitest'

import { settingsSchema } from '@/features/settings/schema'

describe('settingsSchema', () => {
  it('volume 0 sampai 100 diterima', () => {
    expect(settingsSchema.safeParse({ soundVolume: 0 }).success).toBe(true)
    expect(settingsSchema.safeParse({ soundVolume: 100 }).success).toBe(true)
  })

  it('di luar rentang, pecahan, atau bukan angka ditolak', () => {
    expect(settingsSchema.safeParse({ soundVolume: -5 }).success).toBe(false)
    expect(settingsSchema.safeParse({ soundVolume: 101 }).success).toBe(false)
    expect(settingsSchema.safeParse({ soundVolume: 12.5 }).success).toBe(false)
    expect(settingsSchema.safeParse({ soundVolume: Number.NaN }).success).toBe(false)
    expect(settingsSchema.safeParse({ soundVolume: '50' }).success).toBe(false)
  })
})
