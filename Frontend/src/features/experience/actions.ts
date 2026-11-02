'use server'

import { z } from 'zod'

import { deleteUnusedAssets, destroyRemoteAssets } from '@/features/assets/cleanup'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull } from '@/lib/validation'

import { experienceSchema, monthToDate } from './schema'

const idSchema = z.uuid()

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
    const { startMonth, endMonth, location, employmentType, organization_en, ...rest } = parsed.data
    const data = {
      ...rest,
      organization_en: emptyToNull(organization_en),
      location: emptyToNull(location),
      employmentType: employmentType || null,
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
      // logo dan foto ikut dihapus bila tidak dipakai entri lain (DB-01)
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
