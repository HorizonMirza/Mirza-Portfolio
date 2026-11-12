import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { getProfileAssets } from '@/features/assets/queries'
import { getPublicExperiences } from '@/features/experience/public'
import { initials, organizationName } from '@/features/experience/schema'
import { ProfileLive } from '@/features/profile/components/profile-live'
import { getPublicProfile } from '@/features/profile/public'
import { getProfileForEdit } from '@/features/profile/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Profil') }
}

// About → Profil: pita halaman Tentang dan bio diketik langsung (DESIGN.md bagian 136)
export default async function ProfilePage() {
  await requireSuperAdminPage()
  const [values, assets, profile, experiences, tId, tEn] = await Promise.all([
    getProfileForEdit(),
    getProfileAssets(),
    getPublicProfile(),
    getPublicExperiences(),
    getTranslations({ locale: 'id', namespace: 'About' }),
    getTranslations({ locale: 'en', namespace: 'About' }),
  ])
  // chip kampus: pendidikan terbaru, sama seperti halaman Tentang
  const education = experiences
    .filter((e) => e.type === 'EDUCATION')
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  const current = education.find((e) => !e.end) ?? education.at(-1) ?? null
  const chipFor = (locale: 'id' | 'en') =>
    current
      ? {
          name: organizationName(current, locale),
          initials: initials(current.organization),
          logo: current.logo,
        }
      : null
  const chipId = chipFor('id')
  const chipEn = chipFor('en')
  return (
    <>
      <PageHeader title="About" />
      <ModuleTabs moduleId="about" current="/admin/profile" />
      <ProfileLive
        defaultValues={values}
        photo={assets.aboutPhoto?.url ?? assets.photo?.url ?? DEFAULT_PROFILE_PHOTO}
        aboutPhoto={assets.aboutPhoto}
        chip={chipId && chipEn ? { id: chipId, en: chipEn } : null}
        bioHeading={{ id: tId('title'), en: tEn('title') }}
        rolesFallback={{
          id: profile?.aboutRoles_id || tId('roles'),
          en: profile?.aboutRoles_en || tEn('roles'),
        }}
        configured={isUploadConfigured()}
      />
    </>
  )
}
