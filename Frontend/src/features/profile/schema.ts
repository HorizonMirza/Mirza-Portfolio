import { z } from 'zod'

import { optionalText, optionalUrl, requiredText } from '@/lib/validation'

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
  aboutRoles_id: optionalText('Peran di halaman Tentang', 120).default(''),
  aboutRoles_en: optionalText('Roles on the About page', 120).default(''),
  cardRole_id: optionalText('Peran di kartu ID', 60).default(''),
  cardRole_en: optionalText('Role on the ID card', 60).default(''),
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
  cvUrl: optionalUrl('Link CV'),
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
  aboutRoles_id: '',
  aboutRoles_en: '',
  cardRole_id: '',
  cardRole_en: '',
  city: '',
  email: '',
  whatsapp: '',
  cvUrl: '',
  socials: { linkedin: '', github: '', instagram: '', website: '' },
}
