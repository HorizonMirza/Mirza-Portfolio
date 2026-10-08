'use server'

import { z } from 'zod'

import type { Prisma } from '@/generated/prisma/client'
import { type ActionResult, fail, ok, toActionError, zodFieldErrors } from '@/lib/action-result'
import { writeAudit } from '@/lib/audit'
import { requireSuperAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import { moveItem } from '@/lib/reorder'
import { revalidateContent } from '@/lib/revalidate'
import { emptyToNull, githubRepoSchema } from '@/lib/validation'

import { fetchGithubRepo, GithubError, matchSkills } from './github'
import { type GithubImport, projectSchema, type ProjectValues } from './schema'

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

export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    const admin = await requireSuperAdmin()
    if (!idSchema.safeParse(projectId).success) return fail('Project tidak valid.')
    await getDb().$transaction(async (tx) => {
      const before = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { skills: { select: { id: true } } },
      })
      await tx.project.delete({ where: { id: projectId } })
      await writeAudit(tx, {
        actorId: admin.userId,
        action: 'delete',
        entity: 'Project',
        entityId: projectId,
        before: snapshot(before),
      })
    })
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

// Ambil metadata repo publik untuk mengisi form. Tidak menulis ke database.
export async function importFromGithub(repo: unknown): Promise<ActionResult<GithubImport>> {
  try {
    await requireSuperAdmin()
    const parsed = githubRepoSchema.safeParse(repo)
    if (!parsed.success || parsed.data === '') {
      return fail('Format repo tidak valid.', { githubRepo: 'Format: pemilik/nama-repo' })
    }
    const data = await fetchGithubRepo(parsed.data)
    if (data.private) return fail('Repo privat tidak bisa diimpor.')
    const skills = await getDb().skill.findMany({ select: { id: true, name: true } })
    const homepage = data.homepage?.trim() ?? ''
    return ok('Data dari GitHub dimuat. Tinjau lalu simpan.', {
      githubRepo: data.full_name,
      summary_en: (data.description ?? '').slice(0, 240),
      demoUrl: /^https?:\/\//i.test(homepage) ? homepage : '',
      repoUrl: data.html_url,
      year: new Date(data.created_at).getUTCFullYear(),
      skillIds: matchSkills(data, skills),
      topics: data.topics ?? [],
      language: data.language,
    })
  } catch (error) {
    if (error instanceof GithubError) return fail(error.message)
    return toActionError(error)
  }
}
