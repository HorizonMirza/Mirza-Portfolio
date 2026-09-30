import { describe, expect, it } from 'vitest'

import { parseAuthEnv, parseServerEnv, resolveBaseUrl } from '@/lib/env'

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
