import { z } from 'zod'

import { checkTextValue, findTextEntry } from './catalog'

const pair = z.object({ id: z.string().trim(), en: z.string().trim() })

// Satu kunci = sepasang teks ID/EN. Kosong berarti kembali ke teks bawaan.
export const siteTextsSchema = z
  .object({ values: z.record(z.string(), pair) })
  .superRefine((input, ctx) => {
    for (const [key, value] of Object.entries(input.values)) {
      const entry = findTextEntry(key)
      if (!entry) {
        ctx.addIssue({
          code: 'custom',
          path: ['values', key],
          message: 'Teks ini tidak bisa diubah',
        })
        continue
      }
      for (const lang of ['id', 'en'] as const) {
        const message = checkTextValue(entry, value[lang])
        if (message) ctx.addIssue({ code: 'custom', path: ['values', key, lang], message })
      }
    }
  })

export type SiteTextsInput = z.input<typeof siteTextsSchema>
