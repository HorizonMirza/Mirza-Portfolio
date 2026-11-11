import 'server-only'

import { getDb } from '@/lib/db'
import { type DeviceParts, deviceParts } from '@/lib/device'

// Banyaknya kejadian di linimasa Aktivitas (riwayat masuk disimpan 90 hari, lihat cron harian)
export const ACTIVITY_LIMIT = 40

export type AccountSession = {
  id: string
  device: DeviceParts
  location: string | null
  // waktu sesi terakhir diperpanjang (Better Auth memperbarui paling cepat tiap jam)
  lastActive: string
  createdAt: string
  current: boolean
}

export type AccountEvent = {
  id: string
  kind: 'success' | 'failed' | 'password' | 'signout'
  at: string
  device: DeviceParts | null
  location: string | null
  // percobaan dengan email yang tidak terdaftar
  unknownEmail: boolean
}

// Data Admin → Akun (DESIGN.md bagian 120): identitas, sesi aktif, dan linimasa kejadian akun.
export async function getAccountOverview(userId: string, currentSessionId: string) {
  const db = getDb()
  const now = new Date()
  const [user, sessions, logins, changes] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    db.session.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, userAgent: true, createdAt: true, updatedAt: true },
    }),
    db.loginEvent.findMany({
      // percobaan dengan email lain ikut tampil: tanda ada yang mencoba masuk ke panel
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: ACTIVITY_LIMIT,
      select: {
        id: true,
        kind: true,
        userId: true,
        userAgent: true,
        location: true,
        sessionId: true,
        createdAt: true,
      },
    }),
    db.auditLog.findMany({
      where: {
        OR: [
          { action: 'password', entity: 'User', entityId: userId },
          { action: 'signout', entity: 'Session', actorId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: ACTIVITY_LIMIT,
      select: { id: true, action: true, createdAt: true },
    }),
  ])

  // tempat masuk tiap sesi dari riwayat masuk yang membuatnya
  const placeOf = new Map<string, string | null>()
  if (sessions.length > 0) {
    const origin = await db.loginEvent.findMany({
      where: { sessionId: { in: sessions.map((s) => s.id) } },
      select: { sessionId: true, location: true },
    })
    for (const o of origin) if (o.sessionId) placeOf.set(o.sessionId, o.location)
  }

  const events: AccountEvent[] = [
    ...logins.map((e) => ({
      id: e.id,
      kind: e.kind === 'success' ? ('success' as const) : ('failed' as const),
      at: e.createdAt.toISOString(),
      device: deviceParts(e.userAgent),
      location: e.location,
      unknownEmail: e.userId === null,
    })),
    ...changes.map((c) => ({
      id: c.id,
      kind: c.action === 'password' ? ('password' as const) : ('signout' as const),
      at: c.createdAt.toISOString(),
      device: null,
      location: null,
      unknownEmail: false,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_LIMIT)

  return {
    adminSince: user?.createdAt.toISOString() ?? null,
    sessions: sessions.map((s): AccountSession => ({
      id: s.id,
      device: deviceParts(s.userAgent),
      location: placeOf.get(s.id) ?? null,
      lastActive: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      current: s.id === currentSessionId,
    })),
    events,
  }
}
