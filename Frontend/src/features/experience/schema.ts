import { z } from 'zod'

import { optionalText, requiredText } from '@/lib/validation'

export const EXPERIENCE_TYPES = ['WORK', 'EDUCATION', 'ORGANIZATION'] as const

export const experienceTypeLabel: Record<(typeof EXPERIENCE_TYPES)[number], string> = {
  WORK: 'Kerja',
  EDUCATION: 'Pendidikan',
  ORGANIZATION: 'Organisasi',
}

// Periode disimpan per bulan (seperti di CV): "2025-07" → 2025-07-01.
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export const experienceSchema = z
  .object({
    type: z.enum(EXPERIENCE_TYPES),
    organization: requiredText('Instansi', 120),
    title_id: requiredText('Peran', 120),
    title_en: requiredText('Role', 120),
    description_id: requiredText('Uraian', 3000),
    description_en: requiredText('Description', 3000),
    startMonth: z.string().regex(MONTH, 'Bulan mulai wajib diisi'),
    endMonth: z.string().refine((v) => v === '' || MONTH.test(v), 'Bulan selesai tidak valid'),
    location: optionalText('Lokasi', 120),
    status: z.enum(['DRAFT', 'PUBLISHED']),
  })
  // Format YYYY-MM bisa dibandingkan sebagai teks.
  .refine((v) => v.endMonth === '' || v.endMonth >= v.startMonth, {
    path: ['endMonth'],
    message: 'Bulan selesai tidak boleh sebelum bulan mulai',
  })

export type ExperienceInput = z.input<typeof experienceSchema>

export const emptyExperience: ExperienceInput = {
  type: 'WORK',
  organization: '',
  title_id: '',
  title_en: '',
  description_id: '',
  description_en: '',
  startMonth: '',
  endMonth: '',
  location: '',
  status: 'PUBLISHED',
}

export function monthToDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`)
}

export function dateToMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}
