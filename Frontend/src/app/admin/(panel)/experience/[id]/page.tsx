import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getExperienceAssets } from '@/features/assets/queries'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { getExperienceForEdit } from '@/features/experience/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

export const metadata: Metadata = { title: 'Ubah pengalaman' }

export default async function EditExperiencePage({ params }: PageProps<'/admin/experience/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [experience, assets] = await Promise.all([
    getExperienceForEdit(id),
    getExperienceAssets(id),
  ])
  if (!experience) notFound()
  const configured = isUploadConfigured()
  return (
    <>
      <PageHeader
        eyebrow="Pengalaman"
        title={experience.title_id}
        description={experience.organization}
      />
      <div className="flex flex-col gap-6">
        <ExperienceForm key={id} experienceId={id} defaultValues={experience} />
        {/* Logo dan foto tampil di timeline publik (DESIGN.md bagian 38); pendidikan tidak tampil di sana */}
        <AssetSlot
          title="Logo instansi"
          description="Tampil bulat di garis timeline. PNG berlatar transparan atau logo persegi paling rapi; maks. 2 MB."
          target="experience-logo"
          targetId={id}
          asset={assets.logo}
          configured={configured}
        />
        <AssetSlot
          title="Foto kegiatan"
          description="Tampil di sisi seberang teks pada timeline. Rasio 4:3 disarankan; maks. 5 MB."
          target="experience-photo"
          targetId={id}
          asset={assets.photo}
          configured={configured}
        />
      </div>
    </>
  )
}
