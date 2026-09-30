import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { hashIdentifier } from '@/lib/rate-limit'

// Token konfirmasi: acak, hanya hash-nya yang disimpan di database.
export function newConfirmToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
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
