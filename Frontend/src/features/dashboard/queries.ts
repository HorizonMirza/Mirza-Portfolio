import 'server-only'

import { getDb } from '@/lib/db'
import { lastDayKeys } from '@/lib/format'

export type DailyVisits = { day: string; views: number }

export async function getDashboardStats() {
  const db = getDb()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [published, drafts, experiences, skills, newMessages, subscribers, cvDownloads, views7] =
    await Promise.all([
      db.project.count({ where: { status: 'PUBLISHED' } }),
      db.project.count({ where: { status: 'DRAFT' } }),
      db.experience.count(),
      db.skill.count(),
      db.message.count({ where: { status: 'NEW' } }),
      db.subscriber.count({ where: { status: 'CONFIRMED' } }),
      db.cvDownload.count({ where: { createdAt: { gte: since30 } } }),
      db.pageView.count({ where: { createdAt: { gte: since7 } } }),
    ])

  return { published, drafts, experiences, skills, newMessages, subscribers, cvDownloads, views7 }
}

// Kunjungan per hari (hari kalender Asia/Jakarta), 30 hari terakhir, hari kosong = 0.
export async function getDailyVisits(days = 30): Promise<DailyVisits[]> {
  const since = new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000)
  const rows = await getDb().$queryRaw<{ day: string; views: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS day,
           count(*) AS views
    FROM "PageView"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
  `
  const byDay = new Map(rows.map((r) => [r.day, Number(r.views)]))
  return lastDayKeys(days).map((day) => ({ day, views: byDay.get(day) ?? 0 }))
}

export async function getRecentMessages(take = 5) {
  return getDb().message.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, name: true, subject: true, status: true, createdAt: true },
  })
}
