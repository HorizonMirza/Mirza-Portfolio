import { describe, expect, it } from 'vitest'

import { parseAuthEnv, parseServerEnv, resolveBaseUrl, trustedAuthOrigins } from '@/lib/env'

describe('parseServerEnv', () => {
  it('menerima URL PostgreSQL yang valid', () => {
    const env = parseServerEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db' })
    expect(env.DATABASE_URL).toBe('postgresql://u:p@localhost:5432/db')
    expect(env.NODE_ENV).toBe('development')
  })

  it('menolak bila DATABASE_URL kosong', () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/)
  })

  it('menolak URL yang bukan PostgreSQL', () => {
    expect(() => parseServerEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(/PostgreSQL/)
  })

  it('tidak pernah mencantumkan nilai rahasia di pesan galat', () => {
    const secret = 'mysql://admin:rahasia123@host/db'
    expect(() => parseServerEnv({ DATABASE_URL: secret })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining('rahasia123') }),
    )
  })
})

describe('parseAuthEnv', () => {
  const secret = 'x'.repeat(32)

  it('nilai kosong dari .env.example dianggap tidak diisi', () => {
    const env = parseAuthEnv({
      BETTER_AUTH_SECRET: secret,
      BETTER_AUTH_URL: '',
      HASH_SALT_SECRET: '',
      NEXT_PUBLIC_SITE_URL: '  ',
    })
    expect(env.BETTER_AUTH_URL).toBeUndefined()
    expect(env.HASH_SALT_SECRET).toBeUndefined()
    expect(resolveBaseUrl({ ...env, VERCEL_URL: 'preview-abc.vercel.app' })).toBe(
      'https://preview-abc.vercel.app',
    )
  })

  it('secret wajib minimal 32 karakter', () => {
    expect(() => parseAuthEnv({ BETTER_AUTH_SECRET: 'pendek' })).toThrow(/BETTER_AUTH_SECRET/)
    expect(() => parseAuthEnv({ BETTER_AUTH_SECRET: '' })).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('urutan URL dasar: BETTER_AUTH_URL, lalu situs, lalu Vercel', () => {
    expect(
      resolveBaseUrl({
        BETTER_AUTH_SECRET: secret,
        BETTER_AUTH_URL: 'https://a.site',
        NEXT_PUBLIC_SITE_URL: 'https://b.site',
      }),
    ).toBe('https://a.site')
    expect(
      resolveBaseUrl({ BETTER_AUTH_SECRET: secret, NEXT_PUBLIC_SITE_URL: 'https://b.site' }),
    ).toBe('https://b.site')
  })
})

describe('URL auth di Vercel', () => {
  const secret = 'x'.repeat(32)
  const vercel = {
    BETTER_AUTH_SECRET: secret,
    VERCEL_URL: 'mirza-portfolio-abc123-horizonmirza.vercel.app',
    VERCEL_BRANCH_URL: 'mirza-portfolio-git-main-horizonmirza.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'mirza-portfolio.vercel.app',
  }

  it('production tanpa BETTER_AUTH_URL memakai domain production, bukan URL unik deployment', () => {
    const env = parseAuthEnv({ ...vercel, VERCEL_ENV: 'production' })
    expect(resolveBaseUrl(env)).toBe('https://mirza-portfolio.vercel.app')
  })

  it('preview memakai URL deployment', () => {
    const env = parseAuthEnv({ ...vercel, VERCEL_ENV: 'preview' })
    expect(resolveBaseUrl(env)).toBe('https://mirza-portfolio-abc123-horizonmirza.vercel.app')
  })

  it('semua alamat Vercel dipercaya untuk login, tanpa duplikat', () => {
    const origins = trustedAuthOrigins(parseAuthEnv({ ...vercel, VERCEL_ENV: 'production' }))
    expect(origins).toEqual([
      'https://mirza-portfolio.vercel.app',
      'https://mirza-portfolio-git-main-horizonmirza.vercel.app',
      'https://mirza-portfolio-abc123-horizonmirza.vercel.app',
    ])
  })

  it('domain sendiri lewat BETTER_AUTH_URL tetap diutamakan', () => {
    const origins = trustedAuthOrigins(
      parseAuthEnv({ ...vercel, BETTER_AUTH_URL: 'https://mirza.site' }),
    )
    expect(origins[0]).toBe('https://mirza.site')
  })
})
