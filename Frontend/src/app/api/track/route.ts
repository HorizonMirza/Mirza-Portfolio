import { z } from 'zod'

import { clientIp } from '@/lib/client-ip'
import { getDb } from '@/lib/db'
import { jakartaDayKey } from '@/lib/format'
import { consumePublicRateLimit, consumeRateLimit, hashIdentifier } from '@/lib/rate-limit'
import { isBot, isSameOrigin } from '@/lib/request'
import { getSiteSettings } from '@/features/settings/public'

const bodySchema = z.object({
  // path tanpa awalan bahasa, misalnya "/" atau "/projects/gaas"
  path: z
    .string()
    .max(200)
    .regex(/^\/[a-z0-9\-/]*$/),
  locale: z.enum(['id', 'en']),
  referrer: z.string().max(500).nullable().optional(),
})

// Per IP: 120 halaman per jam sudah jauh di atas pengunjung sungguhan.
const RULE = { window: 3600, max: 120 }
// Batas global per hari. Cek asal (sec-fetch-site/origin) bisa dipalsukan klien di luar browser, jadi
// batas ini yang menjamin tabel PageView tidak bisa dibanjiri sampai kuota database habis: paling
// banyak ±1 MB per hari: ±90 MB untuk masa simpan 90 hari, ±365 MB bila dipilih 1 tahun di Admin → Pengaturan (audit 2026-11-01, SEC-01). Kunjungan di atas
// batas tidak dicatat, halaman tetap jalan.
const GLOBAL_RULE = { window: 86_400, max: 5_000 }

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

  // "Hitung kunjungan" mati di Admin → Pengaturan: tidak ada yang dicatat (pelacak juga tidak dipasang;
  // ini pengaman untuk halaman lama yang masih terbuka)
  if (!(await getSiteSettings()).trackVisits) return noContent()

  const ip = clientIp(request.headers)
  // Kunjungan hanya statistik: database gangguan tidak boleh menjadi 500 (dan laporan error) untuk
  // setiap beacon pengunjung; cukup tidak dicatat (audit 2026-11-03, ERR-03).
  try {
    await record(request, parsed.data, ip, ua)
  } catch {
    console.warn('[track] kunjungan tidak tercatat')
  }
  return noContent()
}

async function record(
  request: Request,
  data: z.infer<typeof bodySchema>,
  ip: string,
  ua: string | null,
): Promise<void> {
  const limit = await consumePublicRateLimit('track', ip, RULE)
  if (!limit.allowed) return
  const daily = await consumeRateLimit('public:track:global', GLOBAL_RULE)
  if (!daily.allowed) return

  const host = new URL(request.url).host
  let referrerHost: string | null = null
  if (data.referrer) {
    try {
      const h = new URL(data.referrer).host
      referrerHost = h && h !== host ? h.slice(0, 100) : null
    } catch {
      referrerHost = null
    }
  }

  const day = jakartaDayKey(new Date())
  await getDb().pageView.create({
    data: {
      path: data.path.replace(/\/+$/, '') || '/',
      locale: data.locale,
      referrerHost,
      device: /mobi|android|iphone/i.test(ua ?? '') ? 'mobile' : 'desktop',
      visitorHash: hashIdentifier(`visitor:${day}:${ip}:${ua ?? ''}`),
    },
  })
}
