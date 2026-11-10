import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { ExperienceTable } from '@/features/experience/components/experience-table'
import { listExperiencesAdmin } from '@/features/experience/queries'
import { dateToMonth } from '@/features/experience/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatPeriod } from '@/lib/format'

export const metadata: Metadata = { title: 'Pendidikan' }

// About → Pendidikan: kartu pendidikan di halaman Tentang (sekolah, jurusan, tahun, grade/GPA).
// Datanya tetap tabel Experience berjenis EDUCATION (2026-11-10).
export default async function EducationPage() {
  await requireSuperAdminPage()
  const items = await listExperiencesAdmin('education')
  return (
    <>
      <PageHeader
        title="About"
        description="Pendidikan di halaman Tentang, diurutkan dari yang paling lama. Hanya yang berstatus Terbit yang tampil."
        actions={
          <Button asChild>
            <Link href="/admin/education/new">
              <Plus aria-hidden="true" />
              Tambah
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
          organization: e.organization,
          title_id: e.title_id,
          start: dateToMonth(e.startDate),
          period: formatPeriod(e.startDate, e.endDate),
          status: e.status,
        }))}
      />
    </>
  )
}
