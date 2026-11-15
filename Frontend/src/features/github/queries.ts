import 'server-only'

import { getDb } from '@/lib/db'
import { GITHUB_PALETTE, type Palette, toPalette } from '@/lib/github-palette'

// Warna yang sedang dipakai beranda untuk grafik GitHub: yang disimpan admin, atau biru bawaan.
export async function getGithubPaletteForEdit(): Promise<Palette> {
  const row = await getDb().siteSetting.findUnique({
    where: { id: 1 },
    select: { githubPalette: true },
  })
  return toPalette(row?.githubPalette) ?? GITHUB_PALETTE
}
