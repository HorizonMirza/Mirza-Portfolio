import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceTimelineAdmin } from '@/features/experience/components/experience-timeline-admin'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengalaman') }
}

// Experience: halaman Pengalaman situs tampil sama persis, entri ditekan untuk diubah. Tanpa tab
// Teks halaman (dihapus atas permintaan pemilik 2026-11-13, DESIGN.md bagian 145).
export default async function ExperiencePage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader title="Experience" />
      <ExperienceTimelineAdmin lang={await getAdminLang()} />
    </>
  )
}
