import { z } from 'zod'

import { GITHUB_PRESET_KEYS } from '@backend/lib/github-palette'

// Warna grafik kontribusi GitHub di beranda (Admin → Home → GitHub): satu dari lima pilihan
// (merah, kuning, hijau, biru, ungu); empat tingkat warnanya ditentukan server.
export const githubPaletteSchema = z.object({
  preset: z.enum(GITHUB_PRESET_KEYS, { error: 'Pilihan warna tidak dikenal.' }),
})
