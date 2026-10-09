import { afterEach, describe, expect, it, vi } from 'vitest'

import { getEmailConfig } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { formatMonth, loc } from '@/lib/localized'
import { safeImage } from '@/lib/public-image'
import { isBot, isSameOrigin } from '@/lib/request'
import { pageMetadata, whatsappUrl } from '@/lib/seo'

afterEach(() => vi.unstubAllEnvs())

describe('loc dan formatMonth', () => {
  it('memilih kolom sesuai bahasa, kosong bila null', () => {
    const row = { title_id: 'Judul', title_en: 'Title', note_id: null, note_en: null }
    expect(loc(row, 'title', 'id')).toBe('Judul')
    expect(loc(row, 'title', 'en')).toBe('Title')
    expect(loc(row, 'note', 'en')).toBe('')
  })
  it('bulan diformat tanpa bergeser zona waktu', () => {
    expect(formatMonth('2025-07', 'id')).toMatch(/Jul.*2025/)
    expect(formatMonth('2021-01', 'en')).toMatch(/Jan.*2021/)
  })
})

describe('pageMetadata', () => {
  it('canonical dan hreflang untuk kedua bahasa', () => {
    const meta = pageMetadata({ locale: 'en', path: '/projects', title: 'Projects' })
    expect(meta.alternates).toEqual({
      canonical: '/en/projects',
      languages: { id: '/id/projects', en: '/en/projects' },
    })
  })
  it('beranda tanpa garis miring ganda', () => {
    expect(pageMetadata({ locale: 'id', path: '/', title: 'x' }).alternates?.canonical).toBe('/id')
  })
})

describe('whatsappUrl', () => {
  it('hanya angka', () =>
    expect(whatsappUrl('+62 812-3456-7890')).toBe('https://wa.me/6281234567890'))
  it('awalan 0 diubah ke kode negara 62', () =>
    expect(whatsappUrl('0812 3456 7890')).toBe('https://wa.me/6281234567890'))
})

describe('siteUrl', () => {
  it('urutan sumber URL', () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://mirza.site/' })).toBe('https://mirza.site')
    expect(
      siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'mirza.vercel.app', VERCEL_URL: 'x.vercel.app' }),
    ).toBe('https://mirza.vercel.app')
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: '', VERCEL_URL: 'x.vercel.app' })).toBe(
      'https://x.vercel.app',
    )
    expect(siteUrl({})).toBe('http://localhost:3000')
  })
})

describe('getEmailConfig', () => {
  it('null bila Resend belum diatur', () => {
    expect(getEmailConfig({})).toBeNull()
    expect(getEmailConfig({ RESEND_API_KEY: 're_x', EMAIL_FROM: '' })).toBeNull()
  })
  it('terbaca bila lengkap, CONTACT_TO_EMAIL opsional', () => {
    expect(
      getEmailConfig({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'Mirza <halo@mirza.site>' }),
    ).toMatchObject({
      EMAIL_FROM: 'Mirza <halo@mirza.site>',
    })
  })
})

describe('safeImage', () => {
  const img = {
    url: 'https://res.cloudinary.com/mirza/image/upload/a.png',
    width: 1,
    height: 1,
    alt_id: 'a',
    alt_en: 'a',
  }
  it('hanya gambar dari akun Cloudinary yang dikonfigurasi', () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'mirza')
    expect(safeImage(img)).toBe(img)
    expect(
      safeImage({ ...img, url: 'https://res.cloudinary.com/lain/image/upload/a.png' }),
    ).toBeNull()
    expect(safeImage({ ...img, url: 'https://evil.example/a.png' })).toBeNull()
  })
  it('tanpa nama cloud semua gambar Cloudinary dilewati', () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    expect(safeImage(img)).toBeNull()
  })
  it('tangkapan layar project bawaan repo diterima, path lain tidak', () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    const shot = { ...img, url: '/images/projects/gaas-dashboard.jpg' }
    expect(safeImage(shot)).toBe(shot)
    expect(safeImage({ ...img, url: '/images/projects/../../secret.png' })).toBeNull()
    // gambar project contoh lama sudah dihapus dari repo
    expect(safeImage({ ...img, url: '/demo/projects/project-1-cover.jpg' })).toBeNull()
    expect(safeImage({ ...img, url: '/uploads/a.png' })).toBeNull()
  })
})

describe('isBot dan isSameOrigin', () => {
  it('bot dan user-agent kosong dilewati', () => {
    expect(isBot(null)).toBe(true)
    expect(isBot('Googlebot/2.1')).toBe(true)
    expect(isBot('Mozilla/5.0 (iPhone) Safari/604.1')).toBe(false)
  })
  it('Sec-Fetch-Site, lalu Origin', () => {
    const req = (headers: Record<string, string>) =>
      new Request('https://mirza.site/api/track', { method: 'POST', headers })
    expect(isSameOrigin(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(isSameOrigin(req({ 'sec-fetch-site': 'cross-site' }))).toBe(false)
    expect(isSameOrigin(req({ origin: 'https://mirza.site' }))).toBe(true)
    expect(isSameOrigin(req({ origin: 'https://evil.example' }))).toBe(false)
    expect(isSameOrigin(req({}))).toBe(false)
  })
})

describe('buildCsp', async () => {
  const { buildCsp } = await import('@/lib/csp')
  it('halaman publik: tanpa nonce, eval untuk keyboard 3D, tetap ketat untuk arahan lain', () => {
    const csp = buildCsp({ dev: false, preview: false, upgrade: true })
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("img-src 'self' data: blob: https://res.cloudinary.com")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).not.toContain('api.cloudinary.com')
  })
  it('admin: nonce + strict-dynamic, tanpa unsafe-inline di script-src, boleh unggah ke Cloudinary', () => {
    const csp = buildCsp({ nonce: 'abc123', dev: false, preview: false })
    const script = csp.split('; ').find((d) => d.startsWith('script-src'))!
    expect(script).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'")
    expect(buildCsp({ nonce: 'abc123', dev: false, preview: false })).not.toContain('unsafe-eval')
    expect(csp).toContain("connect-src 'self' https://api.cloudinary.com")
  })
  it('preview mengizinkan toolbar Vercel, dev mengizinkan eval dan websocket', () => {
    expect(buildCsp({ dev: false, preview: true })).toContain('https://vercel.live')
    const dev = buildCsp({ nonce: 'abc123', dev: true, preview: false })
    expect(dev).toContain("'unsafe-eval'")
    expect(dev).not.toContain('upgrade-insecure-requests')
    expect(buildCsp({ dev: false, preview: false })).not.toContain('upgrade-insecure-requests')
  })
})

describe('describeDevice', async () => {
  const { describeDevice } = await import('@/lib/login-notice')
  it('meringkas user-agent', () => {
    expect(
      describeDevice(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
      ),
    ).toBe('Chrome di Windows')
    expect(
      describeDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Version/18.0 Mobile Safari/604.1',
      ),
    ).toBe('Safari di iOS')
    expect(describeDevice(null)).toBe('Browser tidak dikenal di sistem tidak dikenal')
  })
})
