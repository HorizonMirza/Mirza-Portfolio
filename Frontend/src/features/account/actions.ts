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

// Galat Better Auth dibedakan menurut kodenya; dulu semuanya dianggap "password saat ini salah",
// termasuk sesi yang berakhir atau galat server (audit 2026-11-03, ERR-05).
function changePasswordError(error: APIError): ActionResult {
  const code = (error.body as { code?: unknown } | undefined)?.code
  if (code === 'INVALID_PASSWORD')
    return fail('Password saat ini salah.', { currentPassword: 'Password saat ini salah' })
  if (code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG')
    return fail('Panjang password baru tidak sesuai.', {
      newPassword: 'Panjang password baru tidak sesuai',
    })
  if (error.statusCode === 401) return fail('Sesi berakhir. Masuk lagi lalu ulangi.')
  console.error('[account] ganti password gagal', code ?? error.statusCode)
  return fail('Password gagal diganti. Coba lagi sebentar lagi.')
}

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
      if (error instanceof APIError) return changePasswordError(error)
      throw error
    }

    // Ganti password dijalankan Better Auth lewat API-nya sendiri, jadi tidak bisa satu transaksi
    // dengan audit (audit 2026-11-02, DB-03). Password sudah berganti di titik ini: audit dicoba dua
    // kali, dan bila tetap gagal dicatat ke log server (tanpa data pribadi) agar tidak hilang diam-diam.
    // Pengguna tetap mendapat jawaban berhasil karena password memang sudah berganti.
    const entry = {
      actorId: admin.userId,
      action: 'password',
      entity: 'User',
      entityId: admin.userId,
    } as const
    try {
      await writeAudit(getDb(), entry)
    } catch {
      try {
        await writeAudit(getDb(), entry)
      } catch {
        console.error('[account] password diganti tetapi log audit gagal ditulis')
      }
    }
    return ok('Password diganti. Sesi di perangkat lain sudah dikeluarkan.')
  } catch (error) {
    return toActionError(error)
  }
}
