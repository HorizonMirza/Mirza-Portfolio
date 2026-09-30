import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { ExperienceTable } from '@/features/experience/components/experience-table'
import { listExperiencesAdmin } from '@/features/experience/queries'
import { dateToMonth } from '@/features/experience/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatPeriod } from '@/lib/format'

export const metadata: Metadata = { title: 'Pengalaman' }

export default async function ExperiencePage() {
  await requireSuperAdminPage()
  const items = await listExperiencesAdmin()
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Pengalaman dan pendidikan"
        description="Timeline publik diurutkan otomatis dari tanggal mulai terbaru."
        actions={
          <Button asChild>
            <Link href="/admin/experience/new">
              <Plus aria-hidden="true" />
              Tambah
            </Link>
          </Button>
        }
      />
      <ExperienceTable
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
