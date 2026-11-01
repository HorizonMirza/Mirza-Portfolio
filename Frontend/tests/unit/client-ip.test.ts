import { describe, expect, it } from 'vitest'

import { clientIp, trustedProxies } from '@/lib/client-ip'

const h = (xff?: string, realIp?: string) => {
  const headers = new Headers()
  if (xff !== undefined) headers.set('x-forwarded-for', xff)
  if (realIp !== undefined) headers.set('x-real-ip', realIp)
  return headers
}

// audit 2026-11-01, SEC-02: entri kiri x-forwarded-for bisa dipalsukan klien
describe('clientIp', () => {
  it('di Vercel memakai entri pertama (Vercel menimpa header dengan IP klien)', () => {
    expect(clientIp(h('203.0.113.9'), { VERCEL: '1' })).toBe('203.0.113.9')
  })
  it('di luar Vercel tanpa daftar proxy memakai entri paling kanan, bukan entri palsu di kiri', () => {
    expect(clientIp(h('1.2.3.4, 203.0.113.9'), {})).toBe('203.0.113.9')
    expect(clientIp(h('198.51.100.7'), {})).toBe('198.51.100.7')
  })
  it('dengan TRUSTED_PROXIES melewati proxy tepercaya dari kanan', () => {
    const env = { TRUSTED_PROXIES: '10.0.0.0/8, 172.16.0.5' }
    expect(clientIp(h('1.2.3.4, 203.0.113.9, 172.16.0.5, 10.1.2.3'), env)).toBe('203.0.113.9')
    // semua hop tepercaya: entri paling kiri
    expect(clientIp(h('10.0.0.1, 10.0.0.2'), env)).toBe('10.0.0.1')
  })
  it('tanpa x-forwarded-for memakai x-real-ip, lalu "unknown"', () => {
    expect(clientIp(h(undefined, '198.51.100.1'), {})).toBe('198.51.100.1')
    expect(clientIp(h(), {})).toBe('unknown')
  })
  it('daftar proxy dari env dipisah koma dan dibersihkan', () => {
    expect(trustedProxies({ TRUSTED_PROXIES: ' 10.0.0.0/8 ,, 127.0.0.1 ' })).toEqual([
      '10.0.0.0/8',
      '127.0.0.1',
    ])
    expect(trustedProxies({})).toEqual([])
  })
})
