import 'server-only'

import { assetSelect } from '@backend/features/assets/queries'
import { getDb } from '@backend/lib/db'

import { dateToMonth, type ExperienceInput, type ExperienceKind } from './schema'

// Entri lengkap untuk diubah langsung di halaman Admin → About (pendidikan) dan Admin → Experience
// (revisi pemilik 2026-11-13): nilai form dan berkas logo/foto per entri.
// Pendidikan dikelola di About, kerja dan organisasi di Experience (2026-11-10).
export async function listExperienceEntriesAdmin(kind: ExperienceKind) {
  const rows = await getDb().experience.findMany({
    where: kind === 'education' ? { type: 'EDUCATION' } : { type: { not: 'EDUCATION' } },
    orderBy: [{ startDate: 'desc' }, { order: 'asc' }],
    include: { logo: { select: assetSelect }, photo: { select: assetSelect } },
  })
  return rows.map((e) => ({
    id: e.id,
    // jenis pekerjaan lama (enum) untuk mengisi kolom teks bila belum ada
    legacyEmployment: e.employmentType,
    logo: e.logo,
    photo: e.photo,
    values: {
      type: e.type,
      organization: e.organization,
      organization_en: e.organization_en ?? '',
      title_id: e.title_id,
      title_en: e.title_en,
      description_id: e.description_id,
      description_en: e.description_en,
      startMonth: dateToMonth(e.startDate),
      endMonth: e.endDate ? dateToMonth(e.endDate) : '',
      employmentLabel_id: e.employmentLabel_id ?? '',
      employmentLabel_en: e.employmentLabel_en ?? '',
      status: e.status,
    } satisfies ExperienceInput,
  }))
}
