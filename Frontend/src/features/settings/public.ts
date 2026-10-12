import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'
import { DEFAULT_SOUND_VOLUME } from '@/lib/ui-sounds'

export type IntroNoticeContent = {
  title_id: string
  title_en: string
  body_id: string
  body_en: string
}

export type SiteSettings = {
  soundVolume: number
  // null: pemberitahuan pembuka dimatikan atau belum lengkap
  intro: IntroNoticeContent | null
}

// Pengaturan situs untuk halaman publik. Bila belum pernah disimpan atau database bermasalah,
// memakai nilai bawaan agar halaman tetap tampil (tanpa pemberitahuan pembuka).
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
      const complete =
        row?.introEnabled &&
        row.introTitle_id &&
        row.introTitle_en &&
        row.introBody_id &&
        row.introBody_en
      return {
        soundVolume: row?.soundVolume ?? DEFAULT_SOUND_VOLUME,
        intro: complete
          ? {
              title_id: row.introTitle_id!,
              title_en: row.introTitle_en!,
              body_id: row.introBody_id!,
              body_en: row.introBody_en!,
            }
          : null,
      }
    } catch {
      return { soundVolume: DEFAULT_SOUND_VOLUME, intro: null }
    }
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: PUBLIC_CACHE_SECONDS },
)
