import { describe, expect, it } from 'vitest'

import { parseServerEnv } from '@/lib/env'

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
