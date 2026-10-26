'use server'

import type { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'

import { introSchema, soundSchema } from './schema'

// Satu baris SiteSetting (id 1) dipakai bersama oleh volume suara, kartu pembuka, dan foto hero.
// Semua penyimpanan lewat sini agar audit dan cache konsisten.
async function saveSetting(
  actorId: string,
  data: Prisma.SiteSettingUncheckedUpdateInput,
): Promise<void> {
  await getDb().$transaction(async (tx) => {
    const before = await tx.siteSetting.findUnique({ where: { id: 1 } })
    const after = await tx.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...data } as Prisma.SiteSettingUncheckedCreateInput,
      update: data,
    })
    await writeAudit(tx, {
      actorId,
      action: before ? 'update' : 'create',
      entity: 'SiteSetting',
      entityId: '1',
      before,
      after,
    })
  })
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

export async function saveIntroNotice(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = introSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const { introTitle_id, introTitle_en, introBody_id, introBody_en, introEnabled } = parsed.data
    // isian kosong disimpan sebagai null
    await saveSetting(admin.userId, {
      introEnabled,
      introTitle_id: introTitle_id || null,
      introTitle_en: introTitle_en || null,
      introBody_id: introBody_id || null,
      introBody_en: introBody_en || null,
    })
    return ok('Bagian Awal disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
