import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

import { dateToMonth, type EMPLOYMENT_TYPES } from './schema'

export type PublicExperience = {
  id: string
  type: 'WORK' | 'EDUCATION' | 'ORGANIZATION'
  organization: string
  organization_en: string | null
  title_id: string
  title_en: string
  description_id: string
  description_en: string
  // "YYYY-MM"; end null = masih berlangsung
  start: string
  end: string | null
  location: string | null
  employmentType: (typeof EMPLOYMENT_TYPES)[number] | null
  logo: PublicImage | null
  photo: PublicImage | null
}

type PublicImage = {
  url: string
  alt_id: string | null
  alt_en: string | null
  width: number | null
  height: number | null
}

const imageSelect = { url: true, alt_id: true, alt_en: true, width: true, height: true } as const

// Terbaru di atas (PRD U2).
export const getPublicExperiences = cache(
  unstable_cache(
    async (): Promise<PublicExperience[]> => {
      const rows = await getDb().experience.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ startDate: 'desc' }, { order: 'asc' }],
        select: {
          id: true,
          type: true,
          organization: true,
          organization_en: true,
          title_id: true,
          title_en: true,
          description_id: true,
          description_en: true,
          startDate: true,
          endDate: true,
          location: true,
          employmentType: true,
          logo: { select: imageSelect },
          photo: { select: imageSelect },
        },
      })
      return rows.map(({ startDate, endDate, ...r }) => ({
        ...r,
        start: dateToMonth(startDate),
        end: endDate ? dateToMonth(endDate) : null,
      }))
    },
    ['public-experiences'],
    { tags: [CACHE_TAGS.experience], revalidate: PUBLIC_CACHE_SECONDS },
  ),
)
