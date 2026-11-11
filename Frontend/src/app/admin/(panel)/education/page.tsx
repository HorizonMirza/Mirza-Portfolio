import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { ExperienceTable } from '@/features/experience/components/experience-table'
import { listExperiencesAdmin } from '@/features/experience/queries'
import { dateToMonth } from '@/features/experience/schema'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatPeriod } from '@/lib/format'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pendidikan') }
}

// About → Pendidikan: kartu pendidikan di halaman Tentang (sekolah, jurusan, tahun, grade/GPA).
// Datanya tetap tabel Experience berjenis EDUCATION (2026-11-10).
export default async function EducationPage() {
  await requireSuperAdminPage()
  const items = await listExperiencesAdmin('education')
  const { lang, t } = await getAdminT()
  return (
    <>
      <PageHeader
        title="About"
        description="Pendidikan di halaman Tentang, diurutkan dari yang paling lama. Hanya yang berstatus Terbit yang tampil."
        actions={
          <Button asChild>
            <Link href="/admin/education/new">
              <Plus aria-hidden="true" />
              {t('Tambah')}
            </Link>
          </Button>
        }
      />
      <ModuleTabs moduleId="about" current="/admin/education" />
      <ExperienceTable
        kind="education"
        rows={items.map((e) => ({
          id: e.id,
          type: e.type,
          // isi data ikut bahasa admin bila versi Inggrisnya ada
          organization: (lang === 'en' && e.organization_en) || e.organization,
          title: (lang === 'en' && e.title_en) || e.title_id,
          start: dateToMonth(e.startDate),
          period: formatPeriod(e.startDate, e.endDate, lang),
          status: e.status,
        }))}
      />
    </>
  )
}
