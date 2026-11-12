import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/admin/page-header'
import { ExperienceLive } from '@/features/experience/components/experience-live'
import { emptyEducation } from '@/features/experience/schema'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Tambah pendidikan') }
}

// entri baru seperti di timeline situs, diketik langsung (DESIGN.md bagian 137)
export default async function NewEducationPage() {
  await requireSuperAdminPage()
  const [tId, tEn] = await Promise.all([
    getTranslations({ locale: 'id', namespace: 'Experience' }),
    getTranslations({ locale: 'en', namespace: 'Experience' }),
  ])
  return (
    <>
      <PageHeader title="Tambah pendidikan" />
      <ExperienceLive
        experienceId={null}
        defaultValues={emptyEducation()}
        kind="education"
        assets={{ logo: null, photo: null }}
        configured={isUploadConfigured()}
        presentLabel={{ id: tId('present'), en: tEn('present') }}
      />
    </>
  )
}
