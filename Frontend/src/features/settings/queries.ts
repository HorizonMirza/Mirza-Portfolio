import 'server-only'

import { getDb } from '@/lib/db'
import { DEFAULT_SOUND_VOLUME } from '@/lib/ui-sounds'

import type { SettingsInput } from './schema'

export async function getSettingsForEdit(): Promise<SettingsInput> {
  const row = await getDb().siteSetting.findUnique({ where: { id: 1 } })
  return {
    soundVolume: row?.soundVolume ?? DEFAULT_SOUND_VOLUME,
    introEnabled: row?.introEnabled ?? true,
    introTitle_id: row?.introTitle_id ?? '',
    introTitle_en: row?.introTitle_en ?? '',
    introBody_id: row?.introBody_id ?? '',
    introBody_en: row?.introBody_en ?? '',
  }
}
