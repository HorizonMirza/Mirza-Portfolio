'use server'

import { APIError } from 'better-auth'
import { headers } from 'next/headers'

import {
  type ActionResult,
  fail,
  ok,
  toActionError,
  zodFieldErrors,
} from '@backend/lib/action-result'
import { writeAudit } from '@backend/lib/audit'
import { getAuth } from '@backend/lib/auth'
import { requireSuperAdmin } from '@backend/lib/auth-guard'
import { getDb } from '@backend/lib/db'
import { consumeRateLimit, hashIdentifier } from '@backend/lib/rate-limit'

import { maskEmail } from './mask-email'
import { accountEmailSchema, accountNameSchema, changePasswordSchema } from './schema'

const RULE = { window: 900, max: 5 }
// Password diminta lagi untuk ganti nama atau email: sedikit lebih longgar karena salah ketik wajar
const CONFIRM_RULE = { window: 900, max: 10 }

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

// Password akun diminta lagi sebelum nama atau email diganti. Dibatasi seperti ganti password, karena
// ini juga bisa dipakai menebak password saat sesi sudah masuk.
async function confirmAccountPassword(
  userId: string,
  password: string,
): Promise<ActionResult | null> {
  const limit = await consumeRateLimit(hashIdentifier(`account:confirm:${userId}`), CONFIRM_RULE)
  if (!limit.allowed) return fail('Terlalu banyak percobaan. Coba lagi dalam 15 menit.')
  try {
    await getAuth().api.verifyPassword({ body: { password }, headers: await headers() })
  } catch (error) {
    if (error instanceof APIError) {
      const code = (error.body as { code?: unknown } | undefined)?.code
      if (code === 'INVALID_PASSWORD')
        return fail('Password salah.', { password: 'Password salah' })
      if (error.statusCode === 401) return fail('Sesi berakhir. Masuk lagi lalu ulangi.')
    }
    throw error
  }
  return null
}

// Ganti nama akun panel (Admin → Akun). Meminta password. Dicatat di log audit.
export async function renameAccount(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = accountNameSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const denied = await confirmAccountPassword(admin.userId, parsed.data.password)
    if (denied) return denied
    const name = parsed.data.name
    if (name === admin.name) return ok('Nama disimpan.')
    await getDb().$transaction(async (tx) => {
      await tx.user.update({ where: { id: admin.userId }, data: { name } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'User',
        entityId: admin.userId,
        before: { name: admin.name },
        after: { name },
      })
    })
    return ok('Nama disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

// Ganti email login akun panel (Admin → Akun). Meminta password; email baru tidak boleh dipakai akun
// lain. Email di log audit disamarkan. Seed tidak membuat akun baru walau ADMIN_EMAIL berbeda (hanya
// satu Super Admin); skrip admin:reset-password memakai ADMIN_EMAIL, jadi isi dengan email baru.
export async function changeAccountEmail(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = accountEmailSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const denied = await confirmAccountPassword(admin.userId, parsed.data.password)
    if (denied) return denied
    const email = parsed.data.email
    if (email === admin.email.toLowerCase()) return ok('Email disimpan.')
    const db = getDb()
    const taken = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (taken) return fail('Email sudah dipakai akun lain.', { email: 'Email sudah dipakai' })
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: admin.userId }, data: { email } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'update',
        entity: 'User',
        entityId: admin.userId,
        before: { email: maskEmail(admin.email) },
        after: { email: maskEmail(email) },
      })
    })
    return ok('Email disimpan.')
  } catch (error) {
    // dua permintaan berbarengan bisa sama-sama lolos pemeriksaan di atas; constraint unik di database
    // menolak yang kedua, dan galatnya ditandai di isian Email (audit 2026-11-17, DB-04)
    return toActionError(error, { email: 'Email' })
  }
}
