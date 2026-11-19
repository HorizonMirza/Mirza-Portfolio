// Teks hasil suntingan admin untuk halaman publik, di-cache per tag 'siteText' (hanya server).

import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@backend/lib/cache-tags'
import { getDb } from '@backend/lib/db'

import type { TextOverride } from './merge'

// Galat database dilempar dari dalam cache (unstable_cache tidak menyimpan galat) dan baru diganti
// nilai cadangan di luar, agar gangguan sesaat tidak membuat teks bawaan ikut tersimpan di cache
// sampai 10 menit.
const loadTextOverrides = unstable_cache(
  async (): Promise<TextOverride[]> =>
    getDb().siteText.findMany({ select: { key: true, value_id: true, value_en: true } }),
  ['site-text'],
  { tags: [CACHE_TAGS.siteText], revalidate: PUBLIC_CACHE_SECONDS },
)

// Teks hasil suntingan admin untuk halaman publik. Bila database bermasalah, daftar kosong
// sehingga situs memakai teks bawaan dari messages/*.json.
export async function getTextOverrides(): Promise<TextOverride[]> {
  try {
    return await loadTextOverrides()
  } catch {
    return []
  }
}

// Waktu suntingan terakhir pada teks halaman Privasi (ISO) yang tersimpan di SiteText, untuk tanggal
// "Terakhir diperbarui". null bila tidak ada suntingan atau database bermasalah.
const loadPrivacyEditedAt = unstable_cache(
  async (): Promise<string | null> => {
    const row = await getDb().siteText.aggregate({
      where: { key: { startsWith: 'Privacy.' } },
      _max: { updatedAt: true },
    })
    return row._max.updatedAt?.toISOString() ?? null
  },
  ['privacy-edited-at'],
  { tags: [CACHE_TAGS.siteText], revalidate: PUBLIC_CACHE_SECONDS },
)

export async function getPrivacyEditedAt(): Promise<string | null> {
  try {
    return await loadPrivacyEditedAt()
  } catch {
    return null
  }
}
