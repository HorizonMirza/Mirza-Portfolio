import { describe, expect, it } from 'vitest'

import { hashIdentifier, retryAfterSeconds } from '@/lib/rate-limit'

describe('hashIdentifier', () => {
  it('deterministik untuk secret yang sama dan tidak memuat IP mentah', () => {
    const a = hashIdentifier('203.0.113.7', 'secret-satu')
    expect(a).toBe(hashIdentifier('203.0.113.7', 'secret-satu'))
    expect(a).not.toContain('203.0.113.7')
    expect(a).toMatch(/^[0-9a-f]{40}$/)
  })
  it('berbeda untuk secret atau IP lain', () => {
    const a = hashIdentifier('203.0.113.7', 'secret-satu')
    expect(hashIdentifier('203.0.113.7', 'secret-dua')).not.toBe(a)
    expect(hashIdentifier('203.0.113.8', 'secret-satu')).not.toBe(a)
  })
})

describe('retryAfterSeconds', () => {
  it('sisa detik jendela, minimal 1', () => {
    expect(retryAfterSeconds(0, 900, 100_000)).toBe(800)
    expect(retryAfterSeconds(0, 900, 900_000)).toBe(1)
  })
})
