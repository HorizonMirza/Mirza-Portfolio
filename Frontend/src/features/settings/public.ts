import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import type { PublicImage } from '@/features/profile/public'
import { getDb } from '@/lib/db'
import { safeImage } from '@/lib/public-image'
import { DEFAULT_SOUND_VOLUME } from '@/lib/ui-sounds'

export type IntroNoticeContent = {
  title_id: string
  title_en: string
  body_id: string
  body_en: string
}

export type SiteSettings = {
  soundVolume: number
  // foto hero dari admin; null = foto bawaan di repo
  heroPortrait: PublicImage | null
  heroArmor: PublicImage | null
  // null: pemberitahuan pembuka dimatikan atau belum lengkap
  intro: IntroNoticeContent | null
}

// Foto hero hanya dipakai bila ukurannya diketahui dan asalnya akun Cloudinary situs ini.
function heroImage(
  asset:
    | {
        url: string
        width: number | null
        height: number | null
        alt_id: string | null
        alt_en: string | null
      }
    | null
    | undefined,
): PublicImage | null {
  if (!asset?.width || !asset.height) return null
  return safeImage({
    url: asset.url,
    width: asset.width,
    height: asset.height,
    alt_id: asset.alt_id,
    alt_en: asset.alt_en,
  })
}

// Pengaturan situs untuk halaman publik. Bila belum pernah disimpan atau database bermasalah,
// memakai nilai bawaan agar halaman tetap tampil (tanpa pemberitahuan pembuka).
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await getDb().siteSetting.findUnique({
        where: { id: 1 },
        include: { heroPortrait: true, heroArmor: true },
      })
      const complete =
        row?.introEnabled &&
        row.introTitle_id &&
        row.introTitle_en &&
        row.introBody_id &&
        row.introBody_en
      return {
        soundVolume: row?.soundVolume ?? DEFAULT_SOUND_VOLUME,
        heroPortrait: heroImage(row?.heroPortrait),
        heroArmor: heroImage(row?.heroArmor),
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
      return { soundVolume: DEFAULT_SOUND_VOLUME, heroPortrait: null, heroArmor: null, intro: null }
    }
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: PUBLIC_CACHE_SECONDS },
)
