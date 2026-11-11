import { describe, expect, it } from 'vitest'

import { maskEmail } from '@/features/account/mask-email'
import { passwordStrength } from '@/features/account/password-strength'
import { fieldLabel } from '@/features/audit/labels'
import { deviceParts } from '@/lib/device'

describe('Admin → Akun', () => {
  it('email disamarkan tanpa menghilangkan domain', () => {
    expect(maskEmail('purbandono@gmail.com')).toBe('pu••••••••@gmail.com')
    expect(maskEmail('ab@x.id')).toBe('ab•••@x.id')
  })

  it('kekuatan password naik bersama panjangnya', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('pendek')).toBe(1)
    expect(passwordStrength('dua belas kar')).toBe(2)
    expect(passwordStrength('enam belas huruf')).toBe(3)
    expect(passwordStrength('kopi pagi di teras rumah')).toBe(4)
  })

  it('perangkat dikenali dari user-agent', () => {
    expect(
      deviceParts(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Version/18.0 Mobile Safari/604.1',
      ),
    ).toEqual({ browser: 'Safari', os: 'iOS', mobile: true })
    expect(deviceParts(null)).toEqual({ browser: null, os: null, mobile: false })
  })
})

describe('label log audit', () => {
  it('kolom dua bahasa diberi tanda bahasanya', () => {
    expect(fieldLabel('title_en')).toEqual({ base: 'Judul', lang: 'EN' })
    expect(fieldLabel('maintenanceMode')).toEqual({ base: 'Mode perawatan', lang: null })
    expect(fieldLabel('kolomAsing')).toBeNull()
  })
})

describe('tempat masuk dari header Vercel', async () => {
  const { locationFromHeaders } = await import('@/lib/login-events')
  const h = new Headers({ 'x-vercel-ip-city': 'South%20Jakarta', 'x-vercel-ip-country': 'ID' })

  it('kota dan negara dibaca hanya di Vercel', () => {
    expect(locationFromHeaders(h, true)).toBe('South Jakarta, ID')
    // di luar Vercel header bisa dipalsukan klien
    expect(locationFromHeaders(h, false)).toBeNull()
    expect(locationFromHeaders(new Headers(), true)).toBeNull()
  })

  it('isi rusak tidak menggagalkan', () => {
    expect(locationFromHeaders(new Headers({ 'x-vercel-ip-city': '%E0%A4%A' }), true)).toBeNull()
  })
})
