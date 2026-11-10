import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { emptyEducation } from '@/features/experience/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Tambah pendidikan' }

export default async function NewEducationPage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader title="Tambah pendidikan" />
      <ExperienceForm experienceId={null} defaultValues={emptyEducation()} kind="education" />
    </>
  )
}
