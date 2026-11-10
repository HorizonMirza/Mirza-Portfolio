'use server'

import type { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'

import { introSchema, soundSchema } from './schema'
import { introSettingData, writeSetting } from './write'

// Simpan SiteSetting dalam transaksinya sendiri, lalu perbarui cache.
async function saveSetting(
  actorId: string,
  data: Prisma.SiteSettingUncheckedUpdateInput,
): Promise<void> {
  await getDb().$transaction((tx) => writeSetting(tx, actorId, data))
  revalidateContent('settings')
}

export async function saveSoundVolume(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = soundSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    await saveSetting(admin.userId, parsed.data)
    return ok('Pengaturan disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

// Isi kartu pembuka (Admin → Bagian Awal), satu-satunya bagian kartu yang bisa diubah.
export async function saveIntroNotice(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = introSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    await saveSetting(admin.userId, introSettingData(parsed.data))
    return ok('Kartu pembuka disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
