// Logika rute /api/cron/daily: perawatan harian yang dipanggil Vercel Cron (ringkasan kunjungan,
// hapus data lewat masa simpan, sesi kedaluwarsa, dan berkas unggahan yatim).

import { timingSafeEqual } from 'node:crypto'

import { getDb } from '@backend/lib/db'
import { removeOrphanUploads } from '@backend/lib/orphan-uploads'
import { summaryStart } from '@backend/lib/page-view-summary'
import { runSteps } from '@backend/lib/run-steps'
import { toSiteOptions } from '@backend/features/settings/options'

const DAY_MS = 24 * 60 * 60 * 1000
// masa simpan riwayat masuk panel admin (Admin → Akun)
const LOGIN_EVENT_DAYS = 90
// masa simpan log audit (jejak perubahan admin); lebih lama dari itu dihapus
const AUDIT_LOG_DAYS = 365

// Dipanggil Vercel Cron sekali sehari (vercel.json). Vercel mengirim "Authorization: Bearer <CRON_SECRET>".
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: Request) {
  if (!authorized(request))
    return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  const db = getDb()
  const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS)

  // Tiap langkah berdiri sendiri: satu yang gagal tidak menghentikan yang lain, dan respons 500 menyebut
  // langkah mana yang gagal agar Vercel Cron menandai run itu gagal.
  const { data, failed } = await runSteps(
    {
      // 1) Ringkas hari WIB yang sudah lewat sejak ringkasan terakhir ke PageViewDaily. Idempoten.
      ringkasan: async () => {
        const latest = await db.pageViewDaily.aggregate({ _max: { date: true } })
        const since = summaryStart(latest._max.date)
        const summarized = await db.$executeRaw`
          INSERT INTO "PageViewDaily" ("id", "date", "path", "locale", "views", "visitors")
          SELECT gen_random_uuid(), d.day, d.path, d.locale, d.views, d.visitors
          FROM (
            SELECT ("createdAt" AT TIME ZONE 'Asia/Jakarta')::date AS day, "path",
                   coalesce("locale", '') AS locale, count(*)::int AS views,
                   count(DISTINCT "visitorHash")::int AS visitors
            FROM "PageView"
            WHERE "createdAt" >= ${since}
            GROUP BY 1, 2, 3
          ) d
          WHERE d.day < (now() AT TIME ZONE 'Asia/Jakarta')::date
          ON CONFLICT ("date", "path", "locale")
          DO UPDATE SET "views" = EXCLUDED."views", "visitors" = EXCLUDED."visitors"
        `
        return { summarized }
      },
      // 2) Kunjungan mentah yang lewat masa simpan (Admin → Pengaturan: 30, 90, atau 365 hari; dibaca
      // langsung dari database, bukan cache).
      kunjungan: async () => {
        const { visitRetentionDays } = toSiteOptions(
          await db.siteSetting.findUnique({ where: { id: 1 } }),
        )
        const removed = await db.pageView.deleteMany({
          where: { createdAt: { lt: daysAgo(visitRetentionDays) } },
        })
        return { removedPageViews: removed.count }
      },
      // 3) Riwayat masuk admin lebih tua dari LOGIN_EVENT_DAYS.
      'riwayat-masuk': async () => {
        const removed = await db.loginEvent.deleteMany({
          where: { createdAt: { lt: daysAgo(LOGIN_EVENT_DAYS) } },
        })
        return { removedLoginEvents: removed.count }
      },
      // 4) Baris rate limit kedaluwarsa (> 1 hari).
      'rate-limit': async () => {
        const removed = await db.rateLimit.deleteMany({
          where: { windowStart: { lt: BigInt(Date.now() - DAY_MS) } },
        })
        return { removedRateLimits: removed.count }
      },
      // 5) Log audit lebih tua dari AUDIT_LOG_DAYS.
      'log-audit': async () => {
        const removed = await db.auditLog.deleteMany({
          where: { createdAt: { lt: daysAgo(AUDIT_LOG_DAYS) } },
        })
        return { removedAuditLogs: removed.count }
      },
      // 6) Sesi login dan token verifikasi yang sudah kedaluwarsa.
      sesi: async () => {
        const removed = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
        return { removedSessions: removed.count }
      },
      verifikasi: async () => {
        const removed = await db.verification.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        })
        return { removedVerifications: removed.count }
      },
      // 7) Berkas unggahan Cloudinary tanpa baris Asset, lebih tua dari 48 jam.
      'berkas-yatim': async () => ({ removedOrphanUploads: await removeOrphanUploads(db) }),
    },
    (name, error) => {
      console.error(
        `[cron-daily] langkah "${name}" gagal`,
        error instanceof Error ? error.message : error,
      )
    },
  )

  if (failed.length)
    return Response.json({ data, error: { code: 'STEP_FAILED', steps: failed } }, { status: 500 })
  return Response.json({ data })
}
