import { z } from 'zod'

import {
  githubRepoSchema,
  optionalText,
  optionalUrl,
  requiredText,
  slugSchema,
} from '@/lib/validation'

export const PROJECT_CATEGORIES = ['SOFTWARE', 'COMMUNITY_BUSINESS'] as const
export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const

export const projectCategoryLabel: Record<(typeof PROJECT_CATEGORIES)[number], string> = {
  SOFTWARE: 'Software',
  COMMUNITY_BUSINESS: 'Komunitas & Bisnis',
}

const currentYear = new Date().getFullYear()

// Dipakai di form (klien) dan divalidasi ulang di Server Action.
export const projectSchema = z.object({
  slug: slugSchema,
  title_id: requiredText('Judul', 120),
  title_en: requiredText('Title', 120),
  summary_id: requiredText('Ringkasan', 240),
  summary_en: requiredText('Summary', 240),
  role_id: optionalText('Peran', 80),
  role_en: optionalText('Role', 80),
  description_id: requiredText('Deskripsi', 5000),
  description_en: requiredText('Description', 5000),
  caseStudy_id: optionalText('Studi kasus', 20000),
  caseStudy_en: optionalText('Case study', 20000),
  year: z
    .number({ error: 'Tahun wajib diisi' })
    .int('Tahun harus bilangan bulat')
    .min(2000, 'Tahun minimal 2000')
    .max(currentYear + 1, `Tahun maksimal ${currentYear + 1}`),
  category: z.enum(PROJECT_CATEGORIES),
  demoUrl: optionalUrl('URL demo'),
  repoUrl: optionalUrl('URL repo'),
  showDemo: z.boolean(),
  showRepo: z.boolean(),
  githubRepo: githubRepoSchema,
  featured: z.boolean(),
  status: z.enum(CONTENT_STATUSES),
  skillIds: z.array(z.uuid()).max(30, 'Maksimal 30 skill'),
})

export type ProjectInput = z.input<typeof projectSchema>
export type ProjectValues = z.output<typeof projectSchema>

export const emptyProject: ProjectInput = {
  slug: '',
  title_id: '',
  title_en: '',
  summary_id: '',
  summary_en: '',
  role_id: '',
  role_en: '',
  description_id: '',
  description_en: '',
  caseStudy_id: '',
  caseStudy_en: '',
  year: currentYear,
  category: 'SOFTWARE',
  demoUrl: '',
  repoUrl: '',
  showDemo: true,
  showRepo: true,
  githubRepo: '',
  featured: false,
  status: 'DRAFT',
  skillIds: [],
}

// Hasil impor GitHub: hanya mengisi form, admin tetap meninjau sebelum menyimpan.
export type GithubImport = {
  githubRepo: string
  summary_en: string
  demoUrl: string
  repoUrl: string
  year: number
  skillIds: string[]
  topics: string[]
  language: string | null
}
