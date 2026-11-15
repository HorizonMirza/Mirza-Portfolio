import 'server-only'

import { getDb } from '@/lib/db'
import { type GithubPresetKey, presetOf, toPalette } from '@/lib/github-palette'

// Pilihan warna yang sedang dipakai beranda untuk grafik GitHub (biru bila belum pernah diubah).
export async function getGithubPresetForEdit(): Promise<GithubPresetKey> {
  const row = await getDb().siteSetting.findUnique({
    where: { id: 1 },
    select: { githubPalette: true },
  })
  return presetOf(toPalette(row?.githubPalette))
}
