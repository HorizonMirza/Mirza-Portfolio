import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { projectPreviewTexts } from '@/features/projects/admin-texts'
import { ProjectLive } from '@/features/projects/components/project-live'
import { emptyProject } from '@/features/projects/schema'
import { listSkillOptions } from '@/features/skills/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { siteHost } from '@/lib/env'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project baru') }
}

// project baru seperti halaman detail situs; sampul dan galeri setelah disimpan (DESIGN.md bagian 138)
export default async function NewProjectPage() {
  await requireSuperAdminPage()
  const [skillGroups, texts] = await Promise.all([listSkillOptions(), projectPreviewTexts()])
  return (
    <>
      <PageHeader title="Project baru" />
      <ProjectLive
        projectId={null}
        defaultValues={{ ...emptyProject, year: new Date().getFullYear() }}
        skillGroups={skillGroups}
        cover={null}
        configured={isUploadConfigured()}
        texts={texts}
        host={siteHost()}
      />
    </>
  )
}
