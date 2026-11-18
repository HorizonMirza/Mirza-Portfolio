import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { projectPreviewTexts } from '@backend/features/projects/admin-texts'
import { ProjectLive } from '@/features/projects/components/project-live'
import { emptyProject } from '@backend/features/projects/schema'
import { listSkillOptions } from '@backend/features/skills/queries'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'
import { siteHost } from '@backend/lib/env'
import { isUploadConfigured } from '@backend/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Project Baru') }
}

// project baru seperti halaman detail situs; sampul dan galeri setelah disimpan (DESIGN.md bagian 138)
export default async function NewProjectPage() {
  await requireSuperAdminPage()
  const [skillGroups, texts] = await Promise.all([listSkillOptions(), projectPreviewTexts()])
  return (
    <>
      <PageHeader title="Project Baru" />
      <ProjectLive
        projectId={null}
        defaultValues={{ ...emptyProject, year: new Date().getFullYear() }}
        skillGroups={skillGroups}
        cover={null}
        images={[]}
        configured={isUploadConfigured()}
        texts={texts}
        host={siteHost()}
      />
    </>
  )
}
