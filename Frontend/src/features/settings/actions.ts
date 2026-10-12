'use server'

import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'

import { settingsSchema } from './schema'

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const { introTitle_id, introTitle_en, introBody_id, introBody_en, ...rest } = parsed.data
    // isian kosong disimpan sebagai null
    const data = {
      ...rest,
      introTitle_id: introTitle_id || null,
      introTitle_en: introTitle_en || null,
      introBody_id: introBody_id || null,
      introBody_en: introBody_en || null,
    }
    await getDb().$transaction(async (tx) => {
      const before = await tx.siteSetting.findUnique({ where: { id: 1 } })
      const after = await tx.siteSetting.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data,
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: before ? 'update' : 'create',
        entity: 'SiteSetting',
        entityId: '1',
        before,
        after,
      })
    })
    revalidateContent('settings')
    return ok('Pengaturan disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}
