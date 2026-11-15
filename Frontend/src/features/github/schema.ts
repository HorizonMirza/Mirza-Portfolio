import { z } from 'zod'

import { HEX_COLOR, PALETTE_LEVELS } from '@/lib/github-palette'

const colors = z
  .array(z.string().regex(HEX_COLOR, 'Warna harus berformat #rrggbb'))
  .length(PALETTE_LEVELS, 'Setiap tema butuh empat warna')

// Warna grafik kontribusi GitHub di beranda (Admin → Home → GitHub): empat tingkat aktivitas, dari
// paling ringan ke paling berat, untuk tema terang dan gelap.
export const githubPaletteSchema = z.object({ light: colors, dark: colors })

export type GithubPaletteInput = z.input<typeof githubPaletteSchema>
