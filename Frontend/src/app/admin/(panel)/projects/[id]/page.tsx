import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { GalleryPanel } from '@/features/assets/components/asset-panels'
import { getProjectAssets } from '@/features/assets/queries'
import { projectPreviewTexts } from '@/features/projects/admin-texts'
import { ProjectLive } from '@/features/projects/components/project-live'
import { getProjectForEdit } from '@/features/projects/queries'
import { listSkillOptions } from '@/features/skills/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { siteHost } from '@/lib/env'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Ubah project') }
}

// satu project seperti halaman detail situs, diubah langsung (DESIGN.md bagian 138)
export default async function EditProjectPage({ params }: PageProps<'/admin/projects/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [project, skillGroups, assets, texts] = await Promise.all([
    getProjectForEdit(id),
    listSkillOptions(),
    getProjectAssets(id),
    projectPreviewTexts(),
  ])
  if (!project) notFound()
  const configured = isUploadConfigured()
  return (
    <>
      <PageHeader title="Projects" />
      <ProjectLive
        key={id}
        projectId={id}
        defaultValues={project}
        skillGroups={skillGroups}
        cover={assets.cover}
        configured={configured}
        texts={texts}
        host={siteHost()}
        gallery={<GalleryPanel projectId={id} images={assets.images} configured={configured} />}
      />
    </>
  )
}
