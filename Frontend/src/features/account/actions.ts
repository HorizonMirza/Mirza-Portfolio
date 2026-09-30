'use server'

import { APIError } from 'better-auth'
import { headers } from 'next/headers'

import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { getAuth } from '@/lib/auth'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { consumeRateLimit, hashIdentifier } from '@/lib/rate-limit'

import { changePasswordSchema } from './schema'

const RULE = { window: 900, max: 5 }

export async function changePassword(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = changePasswordSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))

    // Batasi tebakan password saat ini walau sesi sudah masuk.
    const limit = await consumeRateLimit(
      hashIdentifier(`account:change-password:${admin.userId}`),
      RULE,
    )
    if (!limit.allowed) return fail('Terlalu banyak percobaan. Coba lagi dalam 15 menit.')

    try {
      await getAuth().api.changePassword({
        body: {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
          // sesi di perangkat lain dikeluarkan
          revokeOtherSessions: true,
        },
        headers: await headers(),
      })
    } catch (error) {
      if (error instanceof APIError) {
        return fail('Password saat ini salah.', { currentPassword: 'Password saat ini salah' })
      }
      throw error
    }

    await writeAudit(getDb(), {
      actorId: admin.userId,
      action: 'password',
      entity: 'User',
      entityId: admin.userId,
    })
    return ok('Password diganti. Sesi di perangkat lain sudah dikeluarkan.')
  } catch (error) {
    return toActionError(error)
  }
}
