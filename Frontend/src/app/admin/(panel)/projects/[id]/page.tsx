import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/features/projects/components/project-form'
import { getProjectForEdit } from '@/features/projects/queries'
import { listSkillOptions } from '@/features/skills/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Ubah project' }

export default async function EditProjectPage({ params }: PageProps<'/admin/projects/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [project, skillGroups] = await Promise.all([getProjectForEdit(id), listSkillOptions()])
  if (!project) notFound()
  return (
    <>
      <PageHeader
        eyebrow="Project"
        title={project.title_id}
        description={`/projects/${project.slug}`}
      />
      <ProjectForm key={id} projectId={id} defaultValues={project} skillGroups={skillGroups} />
    </>
  )
}
