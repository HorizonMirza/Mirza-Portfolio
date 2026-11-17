import 'server-only'

import { assetSelect } from '@/features/assets/queries'
import { getDb } from '@/lib/db'

import { resolveLogo } from './skill-items'

// Kategori beserta skill, untuk halaman admin skill dan pilihan skill di form project.
export async function listSkillCategoriesAdmin() {
  return getDb().skillCategory.findMany({
    orderBy: [{ order: 'asc' }, { name_id: 'asc' }],
    select: {
      id: true,
      name_id: true,
      name_en: true,
      order: true,
      skills: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          icon: true,
          order: true,
          logo: { select: assetSelect },
          _count: { select: { projects: true } },
        },
      },
    },
  })
}

export async function listSkillOptions() {
  const categories = await listSkillCategoriesAdmin()
  return categories.map((c) => ({
    id: c.id,
    name: c.name_id,
    name_en: c.name_en,
    skills: c.skills.map((s) => ({
      id: s.id,
      name: s.name,
      // logo kecil untuk pilihan teknologi project (unggahan, lalu logo asli public/skills)
      logo: resolveLogo(s.name, s.icon, s.logo),
    })),
  }))
}

export type SkillOptionGroup = Awaited<ReturnType<typeof listSkillOptions>>[number]
