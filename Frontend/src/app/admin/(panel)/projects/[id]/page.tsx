// Admin → Projects, ubah satu project di pratinjau halaman detailnya.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { ProjectLive } from '@/features/projects/components/project-live'

import { getProjectAssets } from '@backend/features/assets/queries'
import { projectPreviewTexts } from '@backend/features/projects/admin-texts'
import { getProjectForEdit } from '@backend/features/projects/queries'
import { listSkillOptions } from '@backend/features/skills/queries'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'
import { siteHost } from '@backend/lib/env'
import { isUploadConfigured } from '@backend/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Ubah Project') }
}

// satu project seperti halaman detail situs, diubah langsung
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
        images={assets.images}
        configured={configured}
        texts={texts}
        host={siteHost()}
      />
    </>
  )
}
