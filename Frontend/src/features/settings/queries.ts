import 'server-only'

import { getDb } from '@/lib/db'

import { type SiteOptions, toSiteOptions } from './options'
import type { IntroInput } from './schema'

// Nilai terbaru langsung dari database (bukan cache publik) untuk Admin → Pengaturan.
export async function getSiteOptionsForEdit(): Promise<SiteOptions> {
  const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
  return toSiteOptions(row)
}

export async function getIntroForEdit(): Promise<IntroInput> {
  const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
  return {
    introBody_id: row?.introBody_id ?? '',
    introBody_en: row?.introBody_en ?? '',
  }
}
