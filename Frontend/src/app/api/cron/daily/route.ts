import { timingSafeEqual } from 'node:crypto'

import { getDb } from '@/lib/db'

// Dipanggil Vercel Cron sekali sehari (vercel.json). Vercel mengirim "Authorization: Bearer <CRON_SECRET>".
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

const RETENTION_DAYS = 90

export async function GET(request: Request) {
  if (!authorized(request))
    return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  const db = getDb()

  // 1) Ringkas 7 hari terakhir (hari WIB yang sudah lewat) ke PageViewDaily. Idempoten.
  const summarized = await db.$executeRaw`
    INSERT INTO "PageViewDaily" ("id", "date", "path", "locale", "views", "visitors")
    SELECT gen_random_uuid(), d.day, d.path, d.locale, d.views, d.visitors
    FROM (
      SELECT ("createdAt" AT TIME ZONE 'Asia/Jakarta')::date AS day, "path",
             coalesce("locale", '') AS locale, count(*)::int AS views,
             count(DISTINCT "visitorHash")::int AS visitors
      FROM "PageView"
      WHERE "createdAt" >= now() - interval '8 days'
      GROUP BY 1, 2, 3
    ) d
    WHERE d.day < (now() AT TIME ZONE 'Asia/Jakarta')::date
    ON CONFLICT ("date", "path", "locale")
    DO UPDATE SET "views" = EXCLUDED."views", "visitors" = EXCLUDED."visitors"
  `

  // 2) Hapus kunjungan mentah yang lewat masa simpan dan baris rate limit kedaluwarsa (> 1 hari).
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const removedViews = await db.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } })
  const removedLimits = await db.rateLimit.deleteMany({
    where: { windowStart: { lt: BigInt(Date.now() - 24 * 60 * 60 * 1000) } },
  })

  return Response.json({
    data: {
      summarized,
      removedPageViews: removedViews.count,
      removedRateLimits: removedLimits.count,
    },
  })
}
