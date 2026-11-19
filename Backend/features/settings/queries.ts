// Query admin pengaturan: pilihan Admin → Pengaturan dan isi kartu pembuka, langsung dari database
// (hanya server).

import 'server-only'

import { getDb } from '@backend/lib/db'

import { type SiteOptions, toSiteOptions } from './options'
import type { IntroInput } from './schema'

// Nilai terbaru langsung dari database (bukan cache publik) untuk Admin → Pengaturan.
export async function getSiteOptionsForEdit(): Promise<SiteOptions> {
  const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
  return toSiteOptions(row)
}

// Isi kartu pembuka untuk Admin → Home, tab Kartu Pembuka.
export async function getIntroForEdit(): Promise<IntroInput> {
  const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
  return {
    introBody_id: row?.introBody_id ?? '',
    introBody_en: row?.introBody_en ?? '',
  }
}
