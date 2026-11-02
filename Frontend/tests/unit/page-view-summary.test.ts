import { describe, expect, it } from 'vitest'

import { RETENTION_DAYS, summaryStart } from '@/lib/page-view-summary'

const DAY = 24 * 60 * 60 * 1000
const now = Date.UTC(2026, 10, 2, 12)

// audit 2026-11-02, DB-06: cron yang tertunda lama tetap meringkas semua hari yang terlewat
describe('summaryStart', () => {
  it('cron jalan normal: jendela 8 hari terakhir', () => {
    expect(summaryStart(new Date(now - 1 * DAY), now).getTime()).toBe(now - 8 * DAY)
  })
  it('cron terlewat 20 hari: mulai sehari sebelum ringkasan terakhir', () => {
    const latest = new Date(now - 20 * DAY)
    expect(summaryStart(latest, now).getTime()).toBe(now - 21 * DAY)
  })
  it('belum pernah ada ringkasan: semua kunjungan mentah dalam masa simpan', () => {
    expect(summaryStart(null, now).getTime()).toBe(now - (RETENTION_DAYS + 1) * DAY)
  })
})
