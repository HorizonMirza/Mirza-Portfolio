'use server'

import { z } from 'zod'

import type { Prisma } from '@backend/generated/prisma/client'
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
import { lockOrderScope } from '@backend/lib/order-lock'
import { moveItem } from '@backend/lib/reorder'
import { revalidateContent } from '@backend/lib/revalidate'
import { emptyToNull } from '@backend/lib/validation'

import { projectSchema, type ProjectValues } from './schema'

const idSchema = z.uuid()
const directionSchema = z.enum(['up', 'down'])
const UNIQUE_LABELS = { slug: 'Slug' }

function toData(v: ProjectValues) {
  return {
    slug: v.slug,
    title_id: v.title_id,
    title_en: v.title_en,
    summary_id: v.summary_id,
    summary_en: v.summary_en,
    role_id: emptyToNull(v.role_id),
    role_en: emptyToNull(v.role_en),
    description_id: v.description_id,
    description_en: v.description_en,
    caseStudy_id: emptyToNull(v.caseStudy_id),
    caseStudy_en: emptyToNull(v.caseStudy_en),
    year: v.year,
    category: v.category,
    demoUrl: emptyToNull(v.demoUrl),
    repoUrl: emptyToNull(v.repoUrl),
    showDemo: v.showDemo,
    showRepo: v.showRepo,
    githubRepo: emptyToNull(v.githubRepo),
    featured: v.featured,
    status: v.status,
  } satisfies Prisma.ProjectUpdateInput
}

type ProjectWithSkills = Prisma.ProjectGetPayload<{ include: { skills: { select: { id: true } } } }>

function snapshot(p: ProjectWithSkills) {
  const { skills, ...rest } = p
  return { ...rest, skillIds: skills.map((s) => s.id).sort() }
}

export async function saveProject(
  projectId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireSuperAdmin()
    if (projectId !== null && !idSchema.safeParse(projectId).success)
      return fail('Project tidak valid.')
    const parsed = projectSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    const values = parsed.data
    const data = toData(values)
    const skills = values.skillIds.map((id) => ({ id }))

    const saved = await getDb().$transaction(async (tx) => {
      if (projectId) {
        const before = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          include: { skills: { select: { id: true } } },
        })
        const after = await tx.project.update({
          where: { id: projectId },
          data: {
            ...data,
            // Tanggal terbit pertama dipertahankan walau project dikembalikan ke draf.
            publishedAt: before.publishedAt ?? (values.status === 'PUBLISHED' ? new Date() : null),
            skills: { set: skills },
          },
          include: { skills: { select: { id: true } } },
        })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'Project',
          entityId: after.id,
          before: snapshot(before),
          after: snapshot(after),
        })
        return after
      }
      await lockOrderScope(tx, 'project')
      const last = await tx.project.aggregate({ _max: { order: true } })
      const created = await tx.project.create({
        data: {
          ...data,
          order: (last._max.order ?? -1) + 1,
          publishedAt: values.status === 'PUBLISHED' ? new Date() : null,
          skills: { connect: skills },
        },
        include: { skills: { select: { id: true } } },
      })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'create',
        entity: 'Project',
        entityId: created.id,
        after: snapshot(created),
      })
      return created
    })

    revalidateContent('projects')
    return ok(projectId ? 'Project disimpan.' : 'Project dibuat.', { id: saved.id })
  } catch (error) {
    return toActionError(error, UNIQUE_LABELS)
  }
}

// Teks yang diubah langsung di daftar project (Admin → Projects): judul, peran, dan ringkasan per
// bahasa untuk beberapa project sekaligus; hanya kolom yang dikirim yang diubah.
const projectTextsSchema = z
  .array(
    projectSchema
      .pick({
        title_id: true,
        title_en: true,
        summary_id: true,
        summary_en: true,
        role_id: true,
        role_en: true,
      })
      .partial()
      .extend({ id: z.uuid() }),
  )
  .min(1)
  .max(100)

export async function saveProjectTexts(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const parsed = projectTextsSchema.safeParse(input)
    if (!parsed.success) return fail('Periksa kembali isian.', zodFieldErrors(parsed.error.issues))
    await getDb().$transaction(async (tx) => {
      for (const { id, role_id, role_en, ...rest } of parsed.data) {
        const before = await tx.project.findUniqueOrThrow({ where: { id } })
        const after = await tx.project.update({
          where: { id },
          data: {
            ...rest,
            ...(role_id !== undefined ? { role_id: emptyToNull(role_id) } : {}),
            ...(role_en !== undefined ? { role_en: emptyToNull(role_en) } : {}),
          },
        })
        await writeAudit(tx, {
          actorId: admin.userId,
          action: 'update',
          entity: 'Project',
          entityId: id,
          before,
          after,
        })
      }
    })
    revalidateContent('projects')
    return ok('Project disimpan.')
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(projectId).success) return fail('Project tidak valid.')
    const removedAssets = await getDb().$transaction(async (tx) => {
      const before = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { skills: { select: { id: true } } },
      })
      const images = await tx.projectImage.findMany({
        where: { projectId },
        select: { assetId: true },
      })
      await tx.project.delete({ where: { id: projectId } })
      // sampul dan gambar galeri ikut dihapus bila tidak dipakai di tempat lain (DB-01)
      const removed = await deleteUnusedAssets(tx, [
        before.coverId,
        ...images.map((i) => i.assetId),
      ])
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Project',
        entityId: projectId,
        before: { ...snapshot(before), removedAssets: removed.map((a) => a.publicId) },
      })
      return removed
    })
    await destroyRemoteAssets(removedAssets)
    revalidateContent('projects')
    return ok('Project dihapus.')
  } catch (error) {
    return toActionError(error)
  }
}

export async function moveProject(projectId: string, direction: unknown): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    const dir = directionSchema.safeParse(direction)
    if (!idSchema.safeParse(projectId).success || !dir.success)
      return fail('Permintaan tidak valid.')
    const moved = await getDb().$transaction(async (tx) => {
      const rows = await tx.project.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, order: true },
      })
      const ids = rows.map((r) => r.id)
      const next = moveItem(ids, projectId, dir.data)
      if (!next) return false
      // Tulis ulang urutan 0..n agar nilai ganda lama ikut rapi.
      for (const [order, id] of next.entries()) {
        if (rows.find((r) => r.id === id)?.order !== order) {
          await tx.project.update({ where: { id }, data: { order } })
        }
      }
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'reorder',
        entity: 'Project',
        entityId: projectId,
        before: { order: ids },
        after: { order: next },
      })
      return true
    })
    if (!moved) return fail('Project sudah di ujung daftar.')
    revalidateContent('projects')
    return ok('Urutan diperbarui.')
  } catch (error) {
    return toActionError(error)
  }
}
