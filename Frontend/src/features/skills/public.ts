import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

export type PublicSkillCategory = {
  id: string
  name_id: string
  name_en: string
  skills: { id: string; name: string; icon: string | null; projectSlugs: string[] }[]
}

// Kategori kosong tidak ditampilkan. projectSlugs hanya dari project terbit.
export const getPublicSkills = cache(
  unstable_cache(
    async (): Promise<PublicSkillCategory[]> => {
      const rows = await getDb().skillCategory.findMany({
        orderBy: [{ order: 'asc' }, { name_id: 'asc' }],
        select: {
          id: true,
          name_id: true,
          name_en: true,
          skills: {
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              icon: true,
              projects: { where: { status: 'PUBLISHED' }, select: { slug: true } },
            },
          },
        },
      })
      return rows
        .filter((c) => c.skills.length > 0)
        .map((c) => ({
          ...c,
          skills: c.skills.map(({ projects, ...s }) => ({
            ...s,
            projectSlugs: projects.map((p) => p.slug),
          })),
        }))
    },
    ['public-skills'],
    { tags: [CACHE_TAGS.skills, CACHE_TAGS.projects], revalidate: PUBLIC_CACHE_SECONDS },
  ),
)
