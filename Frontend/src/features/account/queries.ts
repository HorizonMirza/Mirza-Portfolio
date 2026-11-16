import 'server-only'

import { getDb } from '@/lib/db'
import { type DeviceParts, deviceParts } from '@/lib/device'

export type AccountSession = {
  id: string
  device: DeviceParts
  location: string | null
  // waktu sesi terakhir diperpanjang (Better Auth memperbarui paling cepat tiap jam)
  lastActive: string
  createdAt: string
  current: boolean
}

// Data Admin → Akun (DESIGN.md bagian 120): identitas, sesi aktif, dan ganti password terakhir.
export async function getAccountOverview(userId: string, currentSessionId: string) {
  const db = getDb()
  const now = new Date()
  const [user, sessions, lastPassword] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    db.session.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, userAgent: true, createdAt: true, updatedAt: true },
    }),
    // ganti password terakhir (baris "Terakhir diganti …")
    db.auditLog.findFirst({
      where: { action: 'password', entity: 'User', entityId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
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

  return {
    adminSince: user?.createdAt.toISOString() ?? null,
    passwordChangedAt: lastPassword?.createdAt.toISOString() ?? null,
    sessions: sessions.map((s): AccountSession => ({
      id: s.id,
      device: deviceParts(s.userAgent),
      location: placeOf.get(s.id) ?? null,
      lastActive: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      current: s.id === currentSessionId,
    })),
  }
}
