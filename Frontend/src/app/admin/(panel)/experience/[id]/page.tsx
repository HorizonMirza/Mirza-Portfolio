import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { PageHeader } from '@/components/admin/page-header'
import { getExperienceAssets } from '@/features/assets/queries'
import { ExperienceLive } from '@/features/experience/components/experience-live'
import { getExperienceForEdit } from '@/features/experience/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Ubah pengalaman') }
}

// satu entri seperti di timeline situs, diubah langsung (DESIGN.md bagian 137)
export default async function EditExperiencePage({ params }: PageProps<'/admin/experience/[id]'>) {
  await requireSuperAdminPage()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [experience, assets, tId, tEn] = await Promise.all([
    getExperienceForEdit(id),
    getExperienceAssets(id),
    getTranslations({ locale: 'id', namespace: 'Experience' }),
    getTranslations({ locale: 'en', namespace: 'Experience' }),
  ])
  if (!experience) notFound()
  if (experience.type === 'EDUCATION') redirect(`/admin/education/${id}`)
  return (
    <>
      <PageHeader title="Experience" />
      <ExperienceLive
        key={id}
        experienceId={id}
        defaultValues={experience}
        kind="experience"
        assets={assets}
        configured={isUploadConfigured()}
        presentLabel={{ id: tId('present'), en: tEn('present') }}
      />
    </>
  )
}
