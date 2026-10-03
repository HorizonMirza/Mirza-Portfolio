import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'
import { DEFAULT_SOUND_VOLUME } from '@/lib/ui-sounds'

export type SiteSettings = { soundVolume: number }

// Pengaturan situs untuk halaman publik. Bila belum pernah disimpan atau database bermasalah,
// memakai nilai bawaan agar halaman tetap tampil.
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
      return { soundVolume: row?.soundVolume ?? DEFAULT_SOUND_VOLUME }
    } catch {
      return { soundVolume: DEFAULT_SOUND_VOLUME }
    }
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: PUBLIC_CACHE_SECONDS },
)
