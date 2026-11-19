'use server'

// Server Action pendidikan dan pengalaman (Admin → About untuk pendidikan, Admin → Experience untuk
// kerja dan organisasi): simpan dan hapus entri.

import { z } from 'zod'

import { deleteUnusedAssets, destroyRemoteAssets } from '@backend/features/assets/cleanup'
import {
  type ActionResult,
  fail,
  ok,
  toActionError,
  zodFieldErrors,
} from '@backend/lib/action-result'
import { writeAudit } from '@backend/lib/audit'
import { requireSuperAdmin } from '@backend/lib/auth-guard'
import { getDb } from '@backend/lib/db'
import { revalidateContent } from '@backend/lib/revalidate'
import { emptyToNull } from '@backend/lib/validation'

import { experienceSchema, monthToDate } from './schema'

const idSchema = z.uuid()

// Simpan entri baru (experienceId null) atau ubah entri yang ada.
export async function saveExperience(
  experienceId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin()
    if (experienceId !== null && !idSchema.safeParse(experienceId).success)
      return fail('Data tidak valid.')
    const parsed = experienceSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const {
      startMonth,
      endMonth,
      employmentLabel_id,
      employmentLabel_en,
      organization_en,
      ...rest
    } = parsed.data
    const data = {
      ...rest,
      organization_en: emptyToNull(organization_en),
      // jenis pekerjaan berupa teks bebas; kolom enum employmentType dari seed dikosongkan saat disimpan
      employmentType: null,
      employmentLabel_id: emptyToNull(employmentLabel_id),
      employmentLabel_en: emptyToNull(employmentLabel_en),
      startDate: monthToDate(startMonth),
      endDate: endMonth ? monthToDate(endMonth) : null,
    }
    const saved = await getDb().$transaction(async (tx) => {
      if (experienceId) {
        const before = await tx.experience.findUniqueOrThrow({ where: { id: experienceId } })
        const after = await tx.experience.update({ where: { id: experienceId }, data })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'Experience',
          entityId: experienceId,
          before,
          after,
        })
        return after
      }
      const created = await tx.experience.create({ data })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'Experience',
        entityId: created.id,
        after: created,
      })
      return created
    })
    revalidateContent('experience')
    return ok(experienceId ? 'Pengalaman disimpan.' : 'Pengalaman ditambahkan.', { id: saved.id })
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteExperience(experienceId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(experienceId).success) return fail('Data tidak valid.')
    const removedAssets = await getDb().$transaction(async (tx) => {
      const before = await tx.experience.findUniqueOrThrow({ where: { id: experienceId } })
      await tx.experience.delete({ where: { id: experienceId } })
      // logo dan foto ikut dihapus bila tidak dipakai entri lain
      const removed = await deleteUnusedAssets(tx, [before.logoId, before.photoId])
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Experience',
        entityId: experienceId,
        before: { ...before, removedAssets: removed.map((a) => a.publicId) },
      })
      return removed
    })
    await destroyRemoteAssets(removedAssets)
    revalidateContent('experience')
    return ok('Pengalaman dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
