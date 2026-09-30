import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/features/projects/components/project-form'
import { emptyProject } from '@/features/projects/schema'
import { listSkillOptions } from '@/features/skills/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Project baru' }

export default async function NewProjectPage() {
  await requireSuperAdminPage()
  const skillGroups = await listSkillOptions()
  return (
    <>
      <PageHeader eyebrow="Project" title="Project baru" />
      <ProjectForm projectId={null} defaultValues={emptyProject} skillGroups={skillGroups} />
    </>
  )
}
