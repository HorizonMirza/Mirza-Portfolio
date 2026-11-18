import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import {
  type ExperienceTexts,
  ExperienceTimelineLive,
} from '@/features/experience/components/experience-timeline-live'
import { PageHeader } from '@/components/admin/page-header'
import { listExperienceEntriesAdmin } from '@backend/features/experience/queries'
import { EMPLOYMENT_TYPES } from '@backend/features/experience/schema'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'
import { isUploadConfigured } from '@backend/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengalaman') }
}

// teks halaman Pengalaman situs (messages/*.json) untuk satu bahasa
async function siteTexts(locale: 'id' | 'en'): Promise<ExperienceTexts['id']> {
  const msg = await getTranslations({ locale, namespace: 'Experience' })
  // bentuk "# Tahun": angka contoh diganti "#" lagi agar bisa dipakai untuk angka berapa pun
  const forms = (key: 'durationYears' | 'durationMonths') => ({
    one: msg(key, { count: 1 }).replace('1', '#'),
    other: msg(key, { count: 2 }).replace('2', '#'),
  })
  return {
    title: msg('title'),
    none: msg('none'),
    listLabel: msg('listLabel'),
    present: msg('present'),
    employment: Object.fromEntries(
      EMPLOYMENT_TYPES.map((type) => [type, msg(`employment.${type}`)]),
    ) as ExperienceTexts['id']['employment'],
    years: forms('durationYears'),
    months: forms('durationMonths'),
  }
}

// Experience: halaman Pengalaman situs tampil sama persis dan diubah langsung di halaman ini, tanpa
// tab Teks halaman dan tanpa pindah halaman (revisi pemilik 2026-11-13, DESIGN.md bagian 145 dan 147).
export default async function ExperiencePage() {
  await requireSuperAdminPage()
  const [entries, id, en] = await Promise.all([
    listExperienceEntriesAdmin('experience'),
    siteTexts('id'),
    siteTexts('en'),
  ])
  return (
    <>
      <PageHeader title="Experience" />
      <ExperienceTimelineLive
        // jenis pekerjaan lama (daftar tetap) mengisi kolom teks bebas sampai entri disimpan ulang
        initial={entries.map(({ legacyEmployment, ...e }) => ({
          key: e.id,
          ...e,
          values: {
            ...e.values,
            employmentLabel_id:
              e.values.employmentLabel_id ||
              (legacyEmployment ? id.employment[legacyEmployment] : ''),
            employmentLabel_en:
              e.values.employmentLabel_en ||
              (legacyEmployment ? en.employment[legacyEmployment] : ''),
          },
        }))}
        texts={{ id, en }}
        configured={isUploadConfigured()}
      />
    </>
  )
}
