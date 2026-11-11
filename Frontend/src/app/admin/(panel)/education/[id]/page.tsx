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
  return { title: t('Ubah pendidikan') }
}

export default async function EditEducationPage({ params }: PageProps<'/admin/education/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [education, assets] = await Promise.all([getExperienceForEdit(id), getExperienceAssets(id)])
  if (!education) notFound()
  // kerja dan organisasi diubah di menu Experience
  if (education.type !== 'EDUCATION') redirect(`/admin/experience/${id}`)
  const en = (await getAdminLang()) === 'en'
  return (
    <>
      <PageHeader
        title={(en && education.organization_en) || education.organization}
        description={(en && education.title_en) || education.title_id}
      />
      <div className="flex flex-col gap-6">
        <ExperienceForm key={id} experienceId={id} defaultValues={education} kind="education" />
        {/* logo bulat di kartu pendidikan halaman Tentang dan chip kampus di kartu foto */}
        <AssetSlot
          title="Logo sekolah / kampus"
          description="Tampil bulat di kartu pendidikan; logo pendidikan terbaru juga dipakai chip kampus di kartu foto. Logo persegi paling rapi; maks. 2 MB."
          target="experience-logo"
          targetId={id}
          asset={assets.logo}
          configured={isUploadConfigured()}
        />
      </div>
    </>
  )
}
