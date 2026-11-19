// Query admin project: daftar Admin → Projects dan isian form satu project (hanya server).

import 'server-only'

import { getDb } from '@backend/lib/db'

import type { ProjectInput } from './schema'

export async function listProjectsAdmin() {
  return getDb().project.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      slug: true,
      title_id: true,
      title_en: true,
      role_id: true,
      role_en: true,
      summary_id: true,
      summary_en: true,
      status: true,
      featured: true,
      demoUrl: true,
      // sampul untuk daftar admin yang tampil seperti daftar project situs
      cover: { select: { url: true, width: true, height: true } },
      // teknologi untuk chip di daftar admin (sama dengan daftar project situs)
      skills: {
        select: { id: true, name: true, icon: true, logo: { select: { url: true } } },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
    },
  })
}

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
    role_id: p.role_id ?? '',
    role_en: p.role_en ?? '',
    year: p.year,
    category: p.category,
    demoUrl: p.demoUrl ?? '',
    repoUrl: p.repoUrl ?? '',
    showDemo: p.showDemo,
    showRepo: p.showRepo,
    featured: p.featured,
    status: p.status,
    skillIds: p.skills.map((s) => s.id),
  }
}
