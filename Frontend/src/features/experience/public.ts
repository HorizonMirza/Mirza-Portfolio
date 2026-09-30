import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CACHE_TAGS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

import { dateToMonth } from './schema'

export type PublicExperience = {
  id: string
  type: 'WORK' | 'EDUCATION' | 'ORGANIZATION'
  organization: string
  title_id: string
  title_en: string
  description_id: string
  description_en: string
  // "YYYY-MM"; end null = masih berlangsung
  start: string
  end: string | null
  location: string | null
}

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
          title_id: true,
          title_en: true,
          description_id: true,
          description_en: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      })
      return rows.map(({ startDate, endDate, ...r }) => ({
        ...r,
        start: dateToMonth(startDate),
        end: endDate ? dateToMonth(endDate) : null,
      }))
    },
    ['public-experiences'],
    { tags: [CACHE_TAGS.experience] },
  ),
)
