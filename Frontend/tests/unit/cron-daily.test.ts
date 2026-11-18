import { beforeEach, describe, expect, it, vi } from 'vitest'

const count = (n: number) =>
  vi.fn<(args?: unknown) => Promise<{ count: number }>>(async () => ({ count: n }))
const db = {
  pageViewDaily: { aggregate: vi.fn(async () => ({ _max: { date: null } })) },
  $executeRaw: vi.fn(async () => 5),
  siteSetting: { findUnique: vi.fn(async () => null) },
  pageView: { deleteMany: count(1) },
  loginEvent: { deleteMany: count(2) },
  rateLimit: { deleteMany: count(3) },
  auditLog: { deleteMany: count(4) },
  session: { deleteMany: count(5) },
  verification: { deleteMany: count(6) },
}
vi.mock('@/lib/db', () => ({ getDb: () => db }))
vi.mock('@/lib/orphan-uploads', () => ({ removeOrphanUploads: vi.fn(async () => 7) }))
const report = vi.fn(async () => undefined)
vi.mock('@/lib/error-report', () => ({ reportServerError: report }))

process.env.CRON_SECRET = 'rahasia-cron-uji-1234567890'
const { GET } = await import('@/app/api/cron/daily/route')

const call = (secret = process.env.CRON_SECRET) =>
  GET(new Request('http://x/api/cron/daily', { headers: { authorization: `Bearer ${secret}` } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('cron harian', () => {
  it('menolak tanpa rahasia yang benar', async () => {
    expect((await call('salah-salah-salah-salah')).status).toBe(401)
  })

  it('menjalankan semua langkah dan melaporkan hasilnya', async () => {
    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      data: {
        summarized: 5,
        removedPageViews: 1,
        removedLoginEvents: 2,
        removedRateLimits: 3,
        removedAuditLogs: 4,
        removedSessions: 5,
        removedVerifications: 6,
        removedOrphanUploads: 7,
      },
    })
  })

  // audit 2026-11-17, ERR-01
  it('langkah pertama gagal: sisanya tetap jalan dan respons 500 menyebut langkahnya', async () => {
    db.$executeRaw.mockRejectedValueOnce(new Error('ringkasan gagal'))
    const res = await call()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toEqual({ code: 'STEP_FAILED', steps: ['ringkasan'] })
    expect(body.data).toMatchObject({
      removedLoginEvents: 2,
      removedRateLimits: 3,
      removedOrphanUploads: 7,
    })
    expect(db.loginEvent.deleteMany).toHaveBeenCalledOnce()
    expect(report).toHaveBeenCalledOnce()
  })

  // audit 2026-11-17, DB-02
  it('menghapus log audit > 365 hari, sesi dan verifikasi kedaluwarsa', async () => {
    await call()
    const audit = db.auditLog.deleteMany.mock.calls[0]?.[0] as {
      where: { createdAt: { lt: Date } }
    }
    const days = (Date.now() - audit.where.createdAt.lt.getTime()) / 86_400_000
    expect(Math.round(days)).toBe(365)
    expect(db.session.deleteMany).toHaveBeenCalledOnce()
    expect(db.verification.deleteMany).toHaveBeenCalledOnce()
  })
})
