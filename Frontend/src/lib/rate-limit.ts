import 'server-only'

import { createHmac } from 'node:crypto'

import { getDb } from '@/lib/db'
import { getAuthEnv } from '@/lib/env'

export type RateLimitRule = { window: number; max: number }
export type RateLimitResult = { allowed: boolean; retryAfter: number | null }

function hashSecret(): string {
  const env = getAuthEnv()
  // kunci turunan agar hash IP tidak memakai secret auth secara langsung
  return (
    env.HASH_SALT_SECRET ??
    createHmac('sha256', env.BETTER_AUTH_SECRET).update('portfolio:hash-salt').digest('hex')
  )
}

// Hash satu arah untuk IP atau kunci lain yang memuat data pribadi.
export function hashIdentifier(value: string, secret: string = hashSecret()): string {
  return createHmac('sha256', secret).update(value).digest('hex').slice(0, 40)
}

// Sisa detik sampai jendela selesai (dipakai untuk header Retry-After).
export function retryAfterSeconds(windowStartMs: number, windowSeconds: number, nowMs: number) {
  return Math.max(1, Math.ceil((windowStartMs + windowSeconds * 1000 - nowMs) / 1000))
}

// Catat satu permintaan dan kembalikan apakah masih diizinkan. Atomik: satu perintah SQL
// (INSERT ... ON CONFLICT) sehingga permintaan bersamaan tidak bisa melewati batas.
export async function consumeRateLimit(
  hashedKey: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStartThreshold = now - rule.window * 1000
  const rows = await getDb().$queryRaw<{ count: number; windowStart: bigint }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${hashedKey}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" <= ${windowStartThreshold}
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" <= ${windowStartThreshold}
        THEN ${now} ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"
  `
  const row = rows[0]
  if (!row) return { allowed: true, retryAfter: null }
  if (row.count <= rule.max) return { allowed: true, retryAfter: null }
  return {
    allowed: false,
    retryAfter: retryAfterSeconds(Number(row.windowStart), rule.window, now),
  }
}

// Penyimpanan rate limit untuk Better Auth. Kunci aslinya memuat IP, jadi di-hash dulu.
export const authRateLimitStorage = {
  consume: (key: string, rule: RateLimitRule) =>
    consumeRateLimit(`auth:${hashIdentifier(key)}`, rule),
}

// Rate limit form publik (kontak, newsletter, /api/track) per IP yang sudah di-hash.
export function consumePublicRateLimit(action: string, ip: string, rule: RateLimitRule) {
  return consumeRateLimit(`public:${action}:${hashIdentifier(ip)}`, rule)
}
