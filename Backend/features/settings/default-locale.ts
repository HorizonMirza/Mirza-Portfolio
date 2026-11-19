// Bahasa yang dipilih untuk kunjungan pertama ke alamat tanpa /id atau /en, dibaca proxy.ts
// (hanya server).

import 'server-only'

import { getDb } from '@backend/lib/db'

type SiteLocaleChoice = 'browser' | 'id' | 'en'

const TTL_MS = 60_000
const memo = globalThis as unknown as {
  siteLocaleChoice?: { value: SiteLocaleChoice; at: number }
}

// "Bahasa Saat Pertama Dibuka" (Admin → Pengaturan) untuk proxy.ts. Proxy tidak bisa memakai cache data
// Next.js, jadi nilainya diingat 60 detik per instance server; hanya dibaca untuk alamat tanpa /id atau
// /en (kunjungan pertama ke mmirza.site/). Bila database gangguan, ikuti bahasa browser.
export async function siteDefaultLocale(now: number = Date.now()): Promise<SiteLocaleChoice> {
  const hit = memo.siteLocaleChoice
  if (hit && now - hit.at < TTL_MS) return hit.value
  let value: SiteLocaleChoice = 'browser'
  try {
    const row = await getDb().siteSetting.findUnique({
      where: { id: 1 },
      select: { defaultLocale: true },
    })
    if (row?.defaultLocale === 'id' || row?.defaultLocale === 'en') value = row.defaultLocale
  } catch {
    // tetap 'browser'
  }
  memo.siteLocaleChoice = { value, at: now }
  return value
}
