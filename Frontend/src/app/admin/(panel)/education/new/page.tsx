import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { emptyEducation } from '@/features/experience/schema'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Tambah pendidikan') }
}

export default async function NewEducationPage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader title="Tambah pendidikan" />
      <ExperienceForm experienceId={null} defaultValues={emptyEducation()} kind="education" />
    </>
  )
}
