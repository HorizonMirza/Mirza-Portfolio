'use server'

import { z } from 'zod'

import type { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { type MoveDirection, moveItem } from '@/lib/reorder'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull } from '@/lib/validation'

import { skillCategorySchema, skillSchema } from './schema'

const idSchema = z.uuid()
const directionSchema = z.enum(['up', 'down'])

// Skill tampil di halaman skill dan di kartu project, jadi keduanya diperbarui.
function revalidate() {
  revalidateContent('skills', 'projects')
}

async function rewriteOrder(
  rows: { id: string; order: number }[],
  id: string,
  direction: MoveDirection,
  update: (id: string, order: number) => Promise<unknown>,
) {
  const ids = rows.map((r) => r.id)
  const next = moveItem(ids, id, direction)
  if (!next) return null
  for (const [order, rowId] of next.entries()) {
    if (rows.find((r) => r.id === rowId)?.order !== order) await update(rowId, order)
  }
  return { before: ids, after: next }
}

// ---------- Kategori ----------

export async function saveSkillCategory(
  categoryId: string | null,
  input: unknown,
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (categoryId !== null && !idSchema.safeParse(categoryId).success)
      return fail('Kategori tidak valid.')
    const parsed = skillCategorySchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    await getDb().$transaction(async (tx) => {
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
        return
      }
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
    })
    revalidate()
    return ok(categoryId ? 'Kategori disimpan.' : 'Kategori dibuat.')
  } catch (error) {
    return toActionError(error)
  }
}

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

export async function moveSkillCategory(
  categoryId: string,
  direction: unknown,
): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const dir = directionSchema.safeParse(direction)
    if (!idSchema.safeParse(categoryId).success || !dir.success)
      return fail('Permintaan tidak valid.')
    const moved = await getDb().$transaction(async (tx) => {
      const rows = await tx.skillCategory.findMany({
        orderBy: [{ order: 'asc' }, { name_id: 'asc' }],
        select: { id: true, order: true },
      })
      const change = await rewriteOrder(rows, categoryId, dir.data, (id, order) =>
        tx.skillCategory.update({ where: { id }, data: { order } }),
      )
      if (!change) return false
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'reorder',
        entity: 'SkillCategory',
        entityId: categoryId,
        before: { order: change.before },
        after: { order: change.after },
      })
      return true
    })
    if (!moved) return fail('Kategori sudah di ujung daftar.')
    revalidate()
    return ok('Urutan diperbarui.')
  } catch (error) {
    return toActionError(error)
  }
}

// ---------- Skill ----------

export async function saveSkill(skillId: string | null, input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (skillId !== null && !idSchema.safeParse(skillId).success) return fail('Skill tidak valid.')
    const parsed = skillSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const { name, icon, categoryId } = parsed.data
    await getDb().$transaction(async (tx) => {
      const nextOrder = async () => {
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
        return
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
    })
    revalidate()
    return ok(skillId ? 'Skill disimpan.' : 'Skill ditambahkan.')
  } catch (error) {
    return toActionError(error, { name: 'Nama skill' })
  }
}

export async function deleteSkill(skillId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(skillId).success) return fail('Skill tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.skill.findUniqueOrThrow({ where: { id: skillId } })
      // Relasi ke project (tabel penghubung) ikut terhapus otomatis.
      await tx.skill.delete({ where: { id: skillId } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Skill',
        entityId: skillId,
        before,
      })
    })
    revalidate()
    return ok('Skill dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}

export async function moveSkill(skillId: string, direction: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const dir = directionSchema.safeParse(direction)
    if (!idSchema.safeParse(skillId).success || !dir.success) return fail('Permintaan tidak valid.')
    const moved = await getDb().$transaction(async (tx) => {
      const skill = await tx.skill.findUniqueOrThrow({
        where: { id: skillId },
        select: { categoryId: true },
      })
      const rows = await tx.skill.findMany({
        where: { categoryId: skill.categoryId },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true, order: true },
      })
      const change = await rewriteOrder(rows, skillId, dir.data, (id, order) =>
        tx.skill.update({ where: { id }, data: { order } }),
      )
      if (!change) return false
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'reorder',
        entity: 'Skill',
        entityId: skillId,
        before: { order: change.before },
        after: { order: change.after },
      })
      return true
    })
    if (!moved) return fail('Skill sudah di ujung daftar.')
    revalidate()
    return ok('Urutan diperbarui.')
  } catch (error) {
    return toActionError(error)
  }
}
