import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { emptyExperience } from '@/features/experience/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Tambah pengalaman' }

export default async function NewExperiencePage() {
  await requireSuperAdminPage()
  return (
    <>
      <PageHeader eyebrow="Pengalaman" title="Tambah pengalaman" />
      <ExperienceForm experienceId={null} defaultValues={emptyExperience} />
    </>
  )
}
