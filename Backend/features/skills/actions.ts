'use server'

// Server Action skill teknis (Admin → Home → Skill teknis): simpan dan hapus kategori serta skill.

import { z } from 'zod'

import { deleteUnusedAssets, destroyRemoteAssets } from '@backend/features/assets/cleanup'
import type { Prisma } from '@backend/generated/prisma/client'
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
import { lockOrderScope } from '@backend/lib/order-lock'
import { revalidateContent } from '@backend/lib/revalidate'
import { emptyToNull } from '@backend/lib/validation'

import { skillCategorySchema, skillSchema } from './schema'

const idSchema = z.uuid()

// Skill tampil di halaman skill dan di kartu project, jadi keduanya diperbarui.
function revalidate() {
  revalidateContent('skills', 'projects')
}

// ---------- Kategori ----------

// Simpan kategori baru (categoryId null, ditaruh di akhir urutan) atau ubah kategori yang ada.
export async function saveSkillCategory(
  categoryId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin()
    if (categoryId !== null && !idSchema.safeParse(categoryId).success)
      return fail('Kategori tidak valid.')
    const parsed = skillCategorySchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const id = await getDb().$transaction(async (tx) => {
      if (categoryId) {
        const before = await tx.skillCategory.findUniqueOrThrow({ where: { id: categoryId } })
        const after = await tx.skillCategory.update({
          where: { id: categoryId },
          data: parsed.data,
        })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'SkillCategory',
          entityId: categoryId,
          before,
          after,
        })
        return categoryId
      }
      await lockOrderScope(tx, 'skill-category')
      const last = await tx.skillCategory.aggregate({ _max: { order: true } })
      const created = await tx.skillCategory.create({
        data: { ...parsed.data, order: (last._max.order ?? -1) + 1 },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'SkillCategory',
        entityId: created.id,
        after: created,
      })
      return created.id
    })
    revalidate()
    return ok(categoryId ? 'Kategori disimpan.' : 'Kategori dibuat.', { id })
  } catch (error) {
    return toActionError(error)
  }
}

// Hapus kategori; ditolak selama masih berisi skill.
export async function deleteSkillCategory(categoryId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(categoryId).success) return fail('Kategori tidak valid.')
    const result = await getDb().$transaction(async (tx) => {
      const before = await tx.skillCategory.findUniqueOrThrow({
        where: { id: categoryId },
        include: { _count: { select: { skills: true } } },
      })
      if (before._count.skills > 0) return before._count.skills
      await tx.skillCategory.delete({ where: { id: categoryId } })
      const { _count, ...snapshot } = before
      void _count
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'SkillCategory',
        entityId: categoryId,
        before: snapshot,
      })
      return 0
    })
    if (result > 0) {
      return fail(`Kategori masih berisi ${result} skill. Pindahkan atau hapus skill-nya dulu.`)
    }
    revalidate()
    return ok('Kategori dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}

// ---------- Skill ----------

// Simpan skill baru (skillId null, ditaruh di akhir kategorinya) atau ubah skill yang ada.
export async function saveSkill(
  skillId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin()
    if (skillId !== null && !idSchema.safeParse(skillId).success) return fail('Skill tidak valid.')
    const parsed = skillSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const { name, icon, categoryId } = parsed.data
    const id = await getDb().$transaction(async (tx) => {
      const nextOrder = async () => {
        await lockOrderScope(tx, `skill:${categoryId}`)
        const last = await tx.skill.aggregate({ where: { categoryId }, _max: { order: true } })
        return (last._max.order ?? -1) + 1
      }
      if (skillId) {
        const before = await tx.skill.findUniqueOrThrow({ where: { id: skillId } })
        const data: Prisma.SkillUncheckedUpdateInput = { name, icon: emptyToNull(icon), categoryId }
        // Pindah kategori: letakkan di akhir kategori baru.
        if (before.categoryId !== categoryId) data.order = await nextOrder()
        const after = await tx.skill.update({ where: { id: skillId }, data })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'Skill',
          entityId: skillId,
          before,
          after,
        })
        return skillId
      }
      const created = await tx.skill.create({
        data: { name, icon: emptyToNull(icon), categoryId, order: await nextOrder() },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'Skill',
        entityId: created.id,
        after: created,
      })
      return created.id
    })
    revalidate()
    // id dipakai admin untuk langsung membuka jendela logo skill baru
    return ok(skillId ? 'Skill disimpan.' : 'Skill ditambahkan.', { id })
  } catch (error) {
    return toActionError(error, { name: 'Nama Skill' })
  }
}

// Hapus skill beserta logo unggahannya.
export async function deleteSkill(skillId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(skillId).success) return fail('Skill tidak valid.')
    const removedAssets = await getDb().$transaction(async (tx) => {
      const before = await tx.skill.findUniqueOrThrow({ where: { id: skillId } })
      // Relasi ke project (tabel penghubung) ikut terhapus otomatis.
      await tx.skill.delete({ where: { id: skillId } })
      // logo unggahan tidak tertinggal sebagai baris yatim
      const removed = await deleteUnusedAssets(tx, [before.logoId])
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Skill',
        entityId: skillId,
        before,
      })
      return removed
    })
    await destroyRemoteAssets(removedAssets)
    revalidate()
    return ok('Skill dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}
