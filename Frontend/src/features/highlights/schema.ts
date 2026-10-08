import { z } from 'zod'

import { optionalText, requiredText } from '@/lib/validation'

// Angka pencapaian di beranda (DESIGN.md bagian 46). Hanya angka dari CV atau yang dikonfirmasi
// pemilik (CONTENT.md bagian 7).
export const highlightSchema = z.object({
  value: z
    .number({ error: 'Angka wajib diisi' })
    .int('Angka harus bilangan bulat')
    .min(0, 'Angka tidak boleh negatif')
    .max(1_000_000_000, 'Angka terlalu besar'),
  suffix: optionalText('Akhiran', 4),
  label_id: requiredText('Keterangan', 80),
  label_en: requiredText('Label', 80),
  source: optionalText('Asal', 80),
  order: z.number({ error: 'Urutan wajib diisi' }).int().min(0).max(999),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export type HighlightInput = z.input<typeof highlightSchema>

export const emptyHighlight: HighlightInput = {
  value: 0,
  suffix: '+',
  label_id: '',
  label_en: '',
  source: '',
  order: 0,
  status: 'PUBLISHED',
}
