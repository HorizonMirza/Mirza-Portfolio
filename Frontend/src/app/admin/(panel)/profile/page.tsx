import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/admin/page-header'
import { getProfileAssets } from '@backend/features/assets/queries'
import { getPublicExperiences } from '@backend/features/experience/public'
import { listExperienceEntriesAdmin } from '@backend/features/experience/queries'
import { initials, organizationName } from '@backend/features/experience/schema'
import { ProfileLive } from '@/features/profile/components/profile-live'
import { getPublicProfile } from '@backend/features/profile/public'
import { getProfileForEdit } from '@backend/features/profile/queries'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'
import { DEFAULT_PROFILE_PHOTO } from '@/lib/default-photo'
import { isUploadConfigured } from '@backend/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('About') }
}

// About: halaman Tentang dalam satu halaman, profil dan pendidikan (revisi 2026-11-12 dan 2026-11-13)
export default async function ProfilePage() {
  await requireSuperAdminPage()
  const [values, assets, profile, experiences, tId, tEn, educationRows, tIdExp] = await Promise.all(
    [
      getProfileForEdit(),
      getProfileAssets(),
      getPublicProfile(),
      getPublicExperiences(),
      getTranslations({ locale: 'id', namespace: 'About' }),
      getTranslations({ locale: 'en', namespace: 'About' }),
      listExperienceEntriesAdmin('education'),
      getTranslations({ locale: 'id', namespace: 'Experience' }),
    ],
  )
  const tEnExp = await getTranslations({ locale: 'en', namespace: 'Experience' })
  // isi chip bila teks chip kosong: pendidikan terbaru, sama seperti halaman Tentang
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
  return (
    <>
      <PageHeader title="About" />
      <ProfileLive
        defaultValues={values}
        photo={assets.aboutPhoto?.url ?? assets.photo?.url ?? DEFAULT_PROFILE_PHOTO}
        aboutPhoto={assets.aboutPhoto}
        chipLogo={assets.aboutChipLogo}
        chip={{ id: chipFor('id'), en: chipFor('en') }}
        bioHeading={{ id: tId('title'), en: tEn('title') }}
        rolesFallback={{
          id: profile?.aboutRoles_id || tId('roles'),
          en: profile?.aboutRoles_en || tEn('roles'),
        }}
        configured={isUploadConfigured()}
        education={educationRows.map((e) => ({ key: e.id, ...e }))}
        educationHeading={{ id: tId('educationHeading'), en: tEn('educationHeading') }}
        presentLabel={{ id: tIdExp('present'), en: tEnExp('present') }}
      />
    </>
  )
}
