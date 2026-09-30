import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { getExperienceForEdit } from '@/features/experience/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Ubah pengalaman' }

export default async function EditExperiencePage({ params }: PageProps<'/admin/experience/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const experience = await getExperienceForEdit(id)
  if (!experience) notFound()
  return (
    <>
      <PageHeader
        eyebrow="Pengalaman"
        title={experience.title_id}
        description={experience.organization}
      />
      <ExperienceForm key={id} experienceId={id} defaultValues={experience} />
    </>
  )
}
