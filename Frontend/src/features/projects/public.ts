import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import type { PublicImage } from '@/features/profile/public'
import type { Prisma } from '@/generated/prisma/client'
import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'
import { safeImage } from '@/lib/public-image'

export type PublicProjectSummary = {
  slug: string
  title_id: string
  title_en: string
  summary_id: string
  summary_en: string
  year: number
  category: 'SOFTWARE' | 'COMMUNITY_BUSINESS'
  featured: boolean
  demoUrl: string | null
  repoUrl: string | null
  githubRepo: string | null
  cover: PublicImage | null
  skills: { id: string; name: string }[]
}

export type PublicProject = PublicProjectSummary & {
  description_id: string
  description_en: string
  caseStudy_id: string | null
  caseStudy_en: string | null
  images: PublicImage[]
  updatedAt: string
}

const imageSelect = {
  url: true,
  width: true,
  height: true,
  alt_id: true,
  alt_en: true,
} satisfies Prisma.AssetSelect
const summarySelect = {
  slug: true,
  title_id: true,
  title_en: true,
  summary_id: true,
  summary_en: true,
  year: true,
  category: true,
  featured: true,
  demoUrl: true,
  repoUrl: true,
  githubRepo: true,
  cover: { select: imageSelect },
  skills: { select: { id: true, name: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] },
} satisfies Prisma.ProjectSelect

// Hanya project berstatus terbit, urut sesuai urutan di admin.
export const getPublishedProjects = cache(
  unstable_cache(
    async (): Promise<PublicProjectSummary[]> => {
      const rows = await getDb().project.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: summarySelect,
      })
      return rows.map((p) => ({ ...p, cover: safeImage(p.cover) }))
    },
    ['public-projects'],
    { tags: [CACHE_TAGS.projects], revalidate: PUBLIC_CACHE_SECONDS },
  ),
)

export const getPublishedProject = cache(
  unstable_cache(
    async (slug: string): Promise<PublicProject | null> => {
      const p = await getDb().project.findFirst({
        where: { slug, status: 'PUBLISHED' },
        select: {
          ...summarySelect,
          description_id: true,
          description_en: true,
          caseStudy_id: true,
          caseStudy_en: true,
          updatedAt: true,
          images: { orderBy: { order: 'asc' }, select: { asset: { select: imageSelect } } },
        },
      })
      if (!p) return null
      const { images, updatedAt, ...rest } = p
      return {
        ...rest,
        cover: safeImage(rest.cover),
        images: images.flatMap((i) => safeImage(i.asset) ?? []),
        updatedAt: updatedAt.toISOString(),
      }
    },
    ['public-project'],
    { tags: [CACHE_TAGS.projects], revalidate: PUBLIC_CACHE_SECONDS },
  ),
)
