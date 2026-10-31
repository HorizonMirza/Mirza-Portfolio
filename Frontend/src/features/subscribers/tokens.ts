import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { hashIdentifier } from '@/lib/rate-limit'

// Umur maksimal tautan konfirmasi. Halaman token menyebut tautan bisa "kedaluwarsa", padahal dulu
// token berlaku selamanya (audit 2026-10-31, GAP-12).
export const CONFIRM_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// Token konfirmasi: "<waktu terbit base36>.<acak>", hanya hash-nya yang disimpan di database. Waktu
// terbit ikut di-hash, jadi tidak bisa diubah tanpa membuat token tidak cocok lagi; tanpa kolom baru.
export function newConfirmToken(now: number = Date.now()) {
  const token = `${now.toString(36)}.${randomBytes(32).toString('base64url')}`
  return { token, tokenHash: hashToken(token) }
}

// true bila token lebih tua dari CONFIRM_TOKEN_MAX_AGE_MS, terbit di masa depan, atau berformat lama
// tanpa waktu terbit
export function confirmTokenExpired(token: string, now: number = Date.now()): boolean {
  const dot = token.indexOf('.')
  if (dot <= 0) return true
  const issued = Number.parseInt(token.slice(0, dot), 36)
  if (!Number.isFinite(issued)) return true
  return issued > now + 60_000 || now - issued > CONFIRM_TOKEN_MAX_AGE_MS
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

// Token berhenti langganan: id + tanda tangan HMAC, jadi tidak perlu disimpan.
export function unsubscribeToken(subscriberId: string) {
  return `${subscriberId}.${hashIdentifier(`newsletter-unsubscribe:${subscriberId}`)}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [id, sig] = token.split('.')
  if (!id || !sig || !/^[0-9a-f-]{36}$/.test(id)) return null
  const expected = Buffer.from(hashIdentifier(`newsletter-unsubscribe:${id}`))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null
}
