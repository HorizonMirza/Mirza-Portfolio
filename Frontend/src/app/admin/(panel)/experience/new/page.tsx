import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { emptyExperience } from '@/features/experience/schema'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Tambah pengalaman') }
}

export default async function NewExperiencePage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader title="Tambah pengalaman" />
      <ExperienceForm experienceId={null} defaultValues={emptyExperience} kind="experience" />
    </>
  )
}
