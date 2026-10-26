import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

import type { TextOverride } from './merge'

// Teks hasil suntingan admin untuk halaman publik. Bila database bermasalah, daftar kosong
// sehingga situs memakai teks bawaan dari messages/*.json.
export const getTextOverrides = unstable_cache(
  async (): Promise<TextOverride[]> => {
    try {
      const rows = await getDb().siteText.findMany({
        select: { key: true, value_id: true, value_en: true },
      })
      return rows
    } catch {
      return []
    }
  },
  ['site-text'],
  { tags: [CACHE_TAGS.siteText], revalidate: PUBLIC_CACHE_SECONDS },
)
