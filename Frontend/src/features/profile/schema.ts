import { z } from 'zod'

import { optionalText, optionalUrl, requiredText } from '@/lib/validation'

export const AVAILABILITIES = ['OPEN', 'BUSY', 'NOT_LOOKING'] as const

export const availabilityLabel: Record<(typeof AVAILABILITIES)[number], string> = {
  OPEN: 'Terbuka untuk tawaran',
  BUSY: 'Sedang sibuk',
  NOT_LOOKING: 'Tidak mencari',
}

// Kunci link sosial yang didukung. Kolom socials (JSON) hanya menyimpan kunci ini.
export const SOCIAL_KEYS = ['linkedin', 'github', 'instagram', 'website'] as const
export const socialLabel: Record<(typeof SOCIAL_KEYS)[number], string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  instagram: 'Instagram',
  website: 'Situs lain',
}

export const profileSchema = z.object({
  name: requiredText('Nama', 80),
  headline_id: requiredText('Headline', 160),
  headline_en: requiredText('Headline', 160),
  bio_id: requiredText('Bio', 4000),
  bio_en: requiredText('Bio', 4000),
  currentRole_id: optionalText('Posisi sekarang', 160),
  currentRole_en: optionalText('Current role', 160),
  availability: z.enum(AVAILABILITIES),
  availabilityNote_id: optionalText('Catatan ketersediaan', 120),
  availabilityNote_en: optionalText('Availability note', 120),
  city: optionalText('Kota', 80),
  email: z
    .string()
    .trim()
    .max(254, 'Email terlalu panjang')
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Format email tidak valid'),
  whatsapp: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^\+?[0-9]{8,15}$/.test(v),
      'Nomor WhatsApp: 8–15 angka, boleh diawali +',
    ),
  socials: z.object({
    linkedin: optionalUrl('LinkedIn'),
    github: optionalUrl('GitHub'),
    instagram: optionalUrl('Instagram'),
    website: optionalUrl('Situs'),
  }),
})

export type ProfileInput = z.input<typeof profileSchema>

export const emptyProfile: ProfileInput = {
  name: '',
  headline_id: '',
  headline_en: '',
  bio_id: '',
  bio_en: '',
  currentRole_id: '',
  currentRole_en: '',
  availability: 'OPEN',
  availabilityNote_id: '',
  availabilityNote_en: '',
  city: '',
  email: '',
  whatsapp: '',
  socials: { linkedin: '', github: '', instagram: '', website: '' },
}
