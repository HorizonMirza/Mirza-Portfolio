import 'server-only'

import { getDb } from '@/lib/db'

import type { ProjectInput } from './schema'

export async function listProjectsAdmin() {
  return getDb().project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      slug: true,
      title_id: true,
      status: true,
      category: true,
      year: true,
      featured: true,
      updatedAt: true,
    },
  })
}

export type ProjectRow = Awaited<ReturnType<typeof listProjectsAdmin>>[number]

// Nilai awal form edit: null diubah menjadi string kosong agar cocok dengan input form.
export async function getProjectForEdit(id: string): Promise<ProjectInput | null> {
  const p = await getDb().project.findUnique({
    where: { id },
    include: { skills: { select: { id: true } } },
  })
  if (!p) return null
  return {
    slug: p.slug,
    title_id: p.title_id,
    title_en: p.title_en,
    summary_id: p.summary_id,
    summary_en: p.summary_en,
    description_id: p.description_id,
    description_en: p.description_en,
    caseStudy_id: p.caseStudy_id ?? '',
    caseStudy_en: p.caseStudy_en ?? '',
    year: p.year,
    category: p.category,
    demoUrl: p.demoUrl ?? '',
    repoUrl: p.repoUrl ?? '',
    githubRepo: p.githubRepo ?? '',
    featured: p.featured,
    status: p.status,
    skillIds: p.skills.map((s) => s.id),
  }
}
