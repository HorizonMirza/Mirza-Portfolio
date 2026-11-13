import 'server-only'

import { getDb } from '@/lib/db'

import { dateToMonth, type ExperienceInput, type ExperienceKind } from './schema'

// Terbaru di atas, sama seperti timeline publik. Pendidikan dikelola di About → Pendidikan, kerja dan
// organisasi di Experience (2026-11-10).
export async function listExperiencesAdmin(kind: ExperienceKind) {
  return getDb().experience.findMany({
    where: kind === 'education' ? { type: 'EDUCATION' } : { type: { not: 'EDUCATION' } },
    orderBy: [{ startDate: 'desc' }, { order: 'asc' }],
    select: {
      id: true,
      type: true,
      organization: true,
      organization_en: true,
      title_id: true,
      title_en: true,
      startDate: true,
      endDate: true,
      status: true,
      employmentType: true,
      description_id: true,
      description_en: true,
      logo: { select: { url: true } },
      photo: { select: { url: true, width: true, height: true } },
    },
  })
}

export async function getExperienceForEdit(id: string): Promise<ExperienceInput | null> {
  const e = await getDb().experience.findUnique({ where: { id } })
  if (!e) return null
  return {
    type: e.type,
    organization: e.organization,
    organization_en: e.organization_en ?? '',
    title_id: e.title_id,
    title_en: e.title_en,
    description_id: e.description_id,
    description_en: e.description_en,
    startMonth: dateToMonth(e.startDate),
    endMonth: e.endDate ? dateToMonth(e.endDate) : '',
    location: e.location ?? '',
    employmentType: e.employmentType ?? '',
    inStory: e.inStory,
    status: e.status,
  }
}
