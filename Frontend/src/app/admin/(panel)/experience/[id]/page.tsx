import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getExperienceAssets } from '@/features/assets/queries'
import { ExperienceForm } from '@/features/experience/components/experience-form'
import { getExperienceForEdit } from '@/features/experience/queries'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Ubah pengalaman') }
}

export default async function EditExperiencePage({ params }: PageProps<'/admin/experience/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [experience, assets] = await Promise.all([
    getExperienceForEdit(id),
    getExperienceAssets(id),
  ])
  if (!experience) notFound()
  // pendidikan diubah di About → Pendidikan
  if (experience.type === 'EDUCATION') redirect(`/admin/education/${id}`)
  const configured = isUploadConfigured()
  const en = (await getAdminLang()) === 'en'
  return (
    <>
      <PageHeader
        title={(en && experience.title_en) || experience.title_id}
        description={(en && experience.organization_en) || experience.organization}
      />
      <div className="flex flex-col gap-6">
        <ExperienceForm key={id} experienceId={id} defaultValues={experience} />
        {/* Logo dan foto tampil di timeline publik (DESIGN.md bagian 38) */}
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
