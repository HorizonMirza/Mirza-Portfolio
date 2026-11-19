// Validasi Zod kategori dan skill. Tanpa impor server, aman dipakai di klien.

import { z } from 'zod'

import { optionalText, requiredText } from '@backend/lib/validation'

export const skillCategorySchema = z.object({
  name_id: requiredText('Nama Kategori', 60),
  name_en: requiredText('Category name', 60),
})

export const skillSchema = z.object({
  name: requiredText('Nama Skill', 60),
  // nama ikon (slug Simple Icons), opsional
  icon: optionalText('Ikon', 60).regex(
    /^[a-z0-9-]*$/,
    'Ikon hanya huruf kecil, angka, dan tanda hubung',
  ),
  categoryId: z.uuid('Pilih Kategori'),
})
