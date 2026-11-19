// Validasi Zod dan alat bantu pendidikan/pengalaman: format bulan, urutan tampil, nama instansi per
// bahasa, dan inisial logo. Tanpa impor server, aman dipakai di klien.

import { z } from 'zod'

import { optionalText, requiredText } from '@backend/lib/validation'

const EXPERIENCE_TYPES = ['WORK', 'EDUCATION', 'ORGANIZATION'] as const

// Halaman admin: 'experience' (kerja dan organisasi di Admin → Experience) atau 'education' (Admin → About)
export type ExperienceKind = 'experience' | 'education'

// Jenis pekerjaan enum seperti di LinkedIn ("PT PGAS Solution · Internship"), diisi seed; admin
// memakai employmentLabel (teks bebas) yang didahulukan.
export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'SELF_EMPLOYED',
  'FREELANCE',
  'CONTRACT',
  'INTERNSHIP',
  'APPRENTICESHIP',
  'SEASONAL',
  'VOLUNTEER',
] as const

// Periode disimpan per bulan (seperti di CV): "2025-07" → 2025-07-01.
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export const experienceSchema = z
  .object({
    type: z.enum(EXPERIENCE_TYPES),
    organization: requiredText('Instansi', 120),
    organization_en: optionalText('Instansi (EN)', 120).default(''),
    title_id: requiredText('Peran', 120),
    title_en: requiredText('Peran (EN)', 120),
    description_id: requiredText('Uraian', 3000),
    description_en: requiredText('Uraian (EN)', 3000),
    startMonth: z.string().regex(MONTH, 'Bulan mulai wajib diisi'),
    endMonth: z.string().refine((v) => v === '' || MONTH.test(v), 'Bulan selesai tidak valid'),
    // jenis pekerjaan teks bebas per bahasa, mis. "Internship" / "Magang" (opsional)
    employmentLabel_id: optionalText('Jenis Pekerjaan', 60).default(''),
    employmentLabel_en: optionalText('Jenis Pekerjaan (EN)', 60).default(''),
    status: z.enum(['DRAFT', 'PUBLISHED']),
  })
  // Format YYYY-MM bisa dibandingkan sebagai teks.
  .refine((v) => v.endMonth === '' || v.endMonth >= v.startMonth, {
    path: ['endMonth'],
    message: 'Bulan selesai tidak boleh sebelum bulan mulai',
  })

export type ExperienceInput = z.input<typeof experienceSchema>

// Nilai awal kartu baru di admin.
export const emptyEducation = (): ExperienceInput => ({ ...emptyExperience, type: 'EDUCATION' })

export const emptyExperience: ExperienceInput = {
  type: 'WORK',
  organization: '',
  organization_en: '',
  title_id: '',
  title_en: '',
  description_id: '',
  description_en: '',
  startMonth: '',
  endMonth: '',
  employmentLabel_id: '',
  employmentLabel_en: '',
  status: 'PUBLISHED',
}

// Urutan tampil: yang masih berjalan paling atas, lalu yang paling akhir selesai menjabat;
// bila bulan selesainya sama, yang mulai lebih akhir di atas.
export function sortByLatest<T extends { start: string; end: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ea = a.end ?? '9999-12'
    const eb = b.end ?? '9999-12'
    if (ea !== eb) return ea < eb ? 1 : -1
    return a.start < b.start ? 1 : a.start > b.start ? -1 : 0
  })
}

// "2025-07" → Date 2025-07-01 UTC, dan sebaliknya.
export function monthToDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`)
}

export function dateToMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

// Nama instansi sesuai bahasa: organization_en dipakai di halaman bahasa Inggris bila diisi
// ("Universitas Bina Nusantara" / "Bina Nusantara University"), selain itu organization.
export function organizationName(
  row: { organization: string; organization_en?: string | null },
  locale: 'id' | 'en',
): string {
  return locale === 'en' && row.organization_en ? row.organization_en : row.organization
}

// Inisial instansi untuk kotak logo bila logo belum diunggah ("PT PGAS Solution" → "PS").
export function initials(organization: string): string {
  const words = organization
    .replace(/^PT\s+/i, '')
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter((w) => /^[A-Z0-9]/.test(w))
  return (
    words
      .slice(0, 2)
      .map((w) => w[0])
      .join('') || organization.slice(0, 2).toUpperCase()
  )
}
