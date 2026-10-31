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

// Waktu suntingan admin terakhir pada teks halaman Privasi (ISO), untuk tanggal "Terakhir
// diperbarui" (audit 2026-10-31, GAP-08). null bila belum ada suntingan atau database bermasalah.
export const getPrivacyEditedAt = unstable_cache(
  async (): Promise<string | null> => {
    try {
      const row = await getDb().siteText.aggregate({
        where: { key: { startsWith: 'Privacy.' } },
        _max: { updatedAt: true },
      })
      return row._max.updatedAt?.toISOString() ?? null
    } catch {
      return null
    }
  },
  ['privacy-edited-at'],
  { tags: [CACHE_TAGS.siteText], revalidate: PUBLIC_CACHE_SECONDS },
)
