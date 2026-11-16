import 'server-only'

import { getDb } from '@/lib/db'
import { lastDayKeys } from '@/lib/format'
import { toSiteOptions } from '@/features/settings/options'

const DAY_MS = 24 * 60 * 60 * 1000

// Periode Dashboard (desain 01 "Ringkas", pilihan pemilik 2026-11-16)
export const DASHBOARD_RANGES = [7, 30, 90] as const
export type DashboardRange = (typeof DASHBOARD_RANGES)[number]

export function toDashboardRange(value: unknown): DashboardRange {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return (DASHBOARD_RANGES as readonly number[]).includes(n) ? (n as DashboardRange) : 30
}

// Satu hari kalender Asia/Jakarta. visitors null = data per pengunjung sudah tidak ada (kunjungan
// mentah lewat masa simpan di Pengaturan); tayangan tetap ada dari ringkasan harian PageViewDaily.
export type DayStat = {
  day: string
  views: number
  visitors: number | null
  cv: number
  messages: number
}

type DayCount = { day: string; n: bigint }

// Hari ini mundur `days` hari: tayangan, pengunjung unik per hari, unduhan CV, dan pesan masuk.
export async function getDailyStats(days: number): Promise<DayStat[]> {
  const db = getDb()
  const since = new Date(Date.now() - (days + 1) * DAY_MS)
  const keys = lastDayKeys(days)
  const [raw, summary, cv, messages, setting] = await Promise.all([
    db.$queryRaw<{ day: string; views: bigint; visitors: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS day,
             count(*) AS views, count(DISTINCT "visitorHash") AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since} GROUP BY 1`,
    db.$queryRaw<DayCount[]>`
      SELECT to_char("date", 'YYYY-MM-DD') AS day, sum("views")::bigint AS n
      FROM "PageViewDaily" WHERE "date" >= ${keys[0]}::date GROUP BY 1`,
    db.$queryRaw<DayCount[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS day, count(*) AS n
      FROM "CvDownload" WHERE "createdAt" >= ${since} GROUP BY 1`,
    db.$queryRaw<DayCount[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS day, count(*) AS n
      FROM "Message" WHERE "createdAt" >= ${since} GROUP BY 1`,
    db.siteSetting.findUnique({ where: { id: 1 } }),
  ])
  const { visitRetentionDays } = toSiteOptions(setting)
  const rawByDay = new Map(raw.map((r) => [r.day, r]))
  const count = (rows: DayCount[]) => new Map(rows.map((r) => [r.day, Number(r.n)]))
  const summaryByDay = count(summary)
  const cvByDay = count(cv)
  const messagesByDay = count(messages)
  return keys.map((day, i) => {
    // kunjungan mentah utuh untuk hari-hari di dalam masa simpan (cron menghapus yang lebih lama)
    const rawKept = i >= days - visitRetentionDays
    const r = rawByDay.get(day)
    return {
      day,
      views: rawKept ? Number(r?.views ?? 0) : (summaryByDay.get(day) ?? Number(r?.views ?? 0)),
      visitors: rawKept ? Number(r?.visitors ?? 0) : null,
      cv: cvByDay.get(day) ?? 0,
      messages: messagesByDay.get(day) ?? 0,
    }
  })
}

export async function getRecentMessages(take = 4) {
  return getDb().message.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, name: true, subject: true, status: true, createdAt: true },
  })
}
