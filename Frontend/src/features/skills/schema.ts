import { z } from 'zod'

import { optionalText, requiredText } from '@/lib/validation'

export const skillCategorySchema = z.object({
  name_id: requiredText('Nama kategori', 60),
  name_en: requiredText('Category name', 60),
})

export const skillSchema = z.object({
  name: requiredText('Nama skill', 60),
  // nama ikon (slug Simple Icons), opsional
  icon: optionalText('Ikon', 60).regex(
    /^[a-z0-9-]*$/,
    'Ikon hanya huruf kecil, angka, dan tanda hubung',
  ),
  categoryId: z.uuid('Pilih kategori'),
})

export type SkillCategoryInput = z.input<typeof skillCategorySchema>
export type SkillInput = z.input<typeof skillSchema>
