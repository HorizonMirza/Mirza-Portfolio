import 'server-only'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, PUBLIC_CACHE_SECONDS } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'

import type { TextOverride } from './merge'

// Galat database dilempar dari dalam cache (unstable_cache tidak menyimpan galat) dan baru diganti
// nilai cadangan di luar, agar gangguan sesaat tidak membuat teks bawaan ikut tersimpan di cache
// sampai 10 menit (audit 2026-11-03, ERR-01).
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

// Waktu suntingan admin terakhir pada teks halaman Privasi (ISO), untuk tanggal "Terakhir
// diperbarui" (audit 2026-10-31, GAP-08). null bila belum ada suntingan atau database bermasalah.
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
