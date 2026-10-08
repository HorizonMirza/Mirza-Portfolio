import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

export type PublicHighlight = {
  id: string
  value: number
  suffix: string
  label_id: string
  label_en: string
  source: string | null
}

export const getPublicHighlights = cache(
  unstable_cache(
    async (): Promise<PublicHighlight[]> =>
      getDb().highlight.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          value: true,
          suffix: true,
          label_id: true,
          label_en: true,
          source: true,
        },
      }),
    ['public-highlights'],
    { tags: [CACHE_TAGS.highlights], revalidate: PUBLIC_CACHE_SECONDS },
  ),
)
