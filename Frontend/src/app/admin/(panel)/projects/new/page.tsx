import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/features/projects/components/project-form'
import { emptyProject } from '@/features/projects/schema'
import { listSkillOptions } from '@/features/skills/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project baru') }
}

export default async function NewProjectPage() {
  await requireSuperAdminPage()
  const skillGroups = await listSkillOptions()
  return (
    <>
      <PageHeader title="Project baru" />
      <ProjectForm
        projectId={null}
        defaultValues={{ ...emptyProject, year: new Date().getFullYear() }}
        skillGroups={skillGroups}
      />
    </>
  )
}
