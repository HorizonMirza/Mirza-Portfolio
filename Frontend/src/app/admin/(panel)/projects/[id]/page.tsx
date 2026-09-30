import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot, GalleryPanel } from '@/features/assets/components/asset-panels'
import { getProjectAssets } from '@/features/assets/queries'
import { ProjectForm } from '@/features/projects/components/project-form'
import { getProjectForEdit } from '@/features/projects/queries'
import { listSkillOptions } from '@/features/skills/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

export const metadata: Metadata = { title: 'Ubah project' }

export default async function EditProjectPage({ params }: PageProps<'/admin/projects/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [project, skillGroups, assets] = await Promise.all([
    getProjectForEdit(id),
    listSkillOptions(),
    getProjectAssets(id),
  ])
  if (!project) notFound()
  const configured = isUploadConfigured()
  return (
    <>
      <PageHeader
        eyebrow="Project"
        title={project.title_id}
        description={`/projects/${project.slug}`}
      />
      <div className="flex flex-col gap-6">
        <ProjectForm key={id} projectId={id} defaultValues={project} skillGroups={skillGroups} />
        <AssetSlot
          title="Sampul"
          description="Gambar utama di kartu project dan pratinjau tautan. Rasio 16:9 disarankan."
          target="project-cover"
          targetId={id}
          asset={assets.cover}
          configured={configured}
        />
        <GalleryPanel projectId={id} images={assets.images} configured={configured} />
      </div>
    </>
  )
}
