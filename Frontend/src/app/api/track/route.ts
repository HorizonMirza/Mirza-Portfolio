import { z } from 'zod'

import { clientIp } from '@/lib/client-ip'
import { getDb } from '@/lib/db'
import { jakartaDayKey } from '@/lib/format'
import { consumePublicRateLimit, hashIdentifier } from '@/lib/rate-limit'
import { isBot, isSameOrigin } from '@/lib/request'

const bodySchema = z.object({
  // path tanpa awalan bahasa, misalnya "/" atau "/projects/gaas"
  path: z
    .string()
    .max(200)
    .regex(/^\/[a-z0-9\-/]*$/),
  locale: z.enum(['id', 'en']),
  referrer: z.string().max(500).nullable().optional(),
})

const RULE = { window: 3600, max: 300 }

function noContent() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}

// Beacon kunjungan tanpa cookie. Pengunjung unik dihitung dari hash(IP + browser + tanggal WIB)
// dengan kunci rahasia, sehingga berganti setiap hari dan IP mentah tidak pernah disimpan.
export async function POST(request: Request) {
  const ua = request.headers.get('user-agent')
  if (!isSameOrigin(request) || isBot(ua)) return noContent()

  let body: unknown
  try {
    body = JSON.parse(await request.text())
  } catch {
    return new Response(null, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return new Response(null, { status: 400 })

  const ip = clientIp(request.headers)
  const limit = await consumePublicRateLimit('track', ip, RULE)
  if (!limit.allowed) return noContent()

  const host = new URL(request.url).host
  let referrerHost: string | null = null
  if (parsed.data.referrer) {
    try {
      const h = new URL(parsed.data.referrer).host
      referrerHost = h && h !== host ? h.slice(0, 100) : null
    } catch {
      referrerHost = null
    }
  }

  const day = jakartaDayKey(new Date())
  await getDb().pageView.create({
    data: {
      path: parsed.data.path.replace(/\/+$/, '') || '/',
      locale: parsed.data.locale,
      referrerHost,
      device: /mobi|android|iphone/i.test(ua ?? '') ? 'mobile' : 'desktop',
      visitorHash: hashIdentifier(`visitor:${day}:${ip}:${ua ?? ''}`),
    },
  })
  return noContent()
}
