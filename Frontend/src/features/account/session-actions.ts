'use server'

import { z } from 'zod'

import { type ActionResult, fail, ok, toActionError } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { deviceParts } from '@/lib/device'

const idSchema = z.uuid()

function label(userAgent: string | null) {
  const { browser, os } = deviceParts(userAgent)
  return [browser, os].filter(Boolean).join(' · ') || null
}

// Keluarkan satu perangkat (hapus sesinya) dari Admin → Akun. Sesi yang sedang dipakai tidak bisa
// dikeluarkan dari sini (pakai Keluar di menu profil). Better Auth memeriksa sesi ke database setiap
// permintaan, jadi perangkat itu langsung kembali ke halaman login.
export async function revokeSession(id: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return fail('Perangkat tidak ditemukan.')
    if (parsed.data === admin.sessionId)
      return fail('Perangkat ini tidak bisa dikeluarkan dari sini. Pakai Keluar di menu profil.')
    const removed = await getDb().$transaction(async (tx) => {
      const session = await tx.session.findFirst({
        where: { id: parsed.data, userId: admin.userId },
        select: { id: true, userAgent: true },
      })
      if (!session) return false
      await tx.session.delete({ where: { id: session.id } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'signout',
        entity: 'Session',
        entityId: session.id,
        before: { device: label(session.userAgent) },
        after: { device: null },
      })
      return true
    })
    return removed ? ok('Perangkat dikeluarkan.') : fail('Perangkat sudah tidak aktif.')
  } catch (error) {
    return toActionError(error)
  }
}

// Keluarkan semua perangkat lain sekaligus; sesi yang sedang dipakai tetap.
export async function revokeOtherSessions(): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const count = await getDb().$transaction(async (tx) => {
      const { count } = await tx.session.deleteMany({
        where: { userId: admin.userId, id: { not: admin.sessionId } },
      })
      if (count > 0)
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'signout',
          entity: 'Session',
          before: { sessions: count },
          after: { sessions: 0 },
        })
      return count
    })
    return count > 0
      ? ok('{count} perangkat lain dikeluarkan.'.replace('{count}', String(count)))
      : ok('Tidak ada perangkat lain yang masuk.')
  } catch (error) {
    return toActionError(error)
  }
}
