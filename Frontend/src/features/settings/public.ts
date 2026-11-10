import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import type { PublicImage } from '@/lib/public-image'
import { getDb } from '@/lib/db'
import { safeImage } from '@/lib/public-image'
import { DEFAULT_SOUND_VOLUME } from '@/lib/ui-sounds'

// hanya isi; judul kartu teks tetap (Intro.title di messages/*.json, 2026-11-10)
export type IntroNoticeContent = {
  body_id: string
  body_en: string
}

export type SiteSettings = {
  soundVolume: number
  // foto hero dari admin; null = foto bawaan di repo
  heroPortrait: PublicImage | null
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

// Galat database dilempar dari dalam cache dan baru diganti nilai bawaan di luar (getSiteSettings),
// agar gangguan sesaat tidak menyimpan foto hero bawaan dan kartu pembuka mati di cache sampai
// 10 menit (audit 2026-11-03, ERR-01).
const loadSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const row = await getDb().siteSetting.findUnique({
      where: { id: 1 },
      include: { heroPortrait: true },
    })
    // kartu selalu tampil selama isinya lengkap (saklar tampil/sembunyi dihapus 2026-11-10)
    const complete = row?.introBody_id && row.introBody_en
    return {
      soundVolume: row?.soundVolume ?? DEFAULT_SOUND_VOLUME,
      heroPortrait: heroImage(row?.heroPortrait),
      intro: complete
        ? {
            body_id: row.introBody_id!,
            body_en: row.introBody_en!,
          }
        : null,
    }
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: PUBLIC_CACHE_SECONDS },
)

// Pengaturan situs untuk halaman publik. Bila belum pernah disimpan atau database bermasalah,
// memakai nilai bawaan agar halaman tetap tampil (tanpa pemberitahuan pembuka).
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await loadSiteSettings()
  } catch {
    return { soundVolume: DEFAULT_SOUND_VOLUME, heroPortrait: null, intro: null }
  }
}
