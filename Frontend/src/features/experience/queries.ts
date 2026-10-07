import 'server-only'

import { getDb } from '@/lib/db'

import { dateToMonth, type ExperienceInput } from './schema'

// Terbaru di atas, sama seperti timeline publik.
export async function listExperiencesAdmin() {
  return getDb().experience.findMany({
    orderBy: [{ startDate: 'desc' }, { order: 'asc' }],
    select: {
      id: true,
      type: true,
      organization: true,
      title_id: true,
      startDate: true,
      endDate: true,
      status: true,
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
    status: e.status,
  }
}
