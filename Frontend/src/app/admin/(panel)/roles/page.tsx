// Admin → Home, tab Peran: peran di bawah foto beranda, diketik di pratinjau.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SitePreviewHeader } from '@/components/admin/site-preview-header'
import { HeroRolesForm } from '@/features/profile/components/hero-roles-form'
import { HERO_PORTRAIT } from '@/lib/default-photo'

import { getHeroPortraitAsset } from '@backend/features/assets/queries'
import { getPublicProfile } from '@backend/features/profile/public'
import { getHeroRolesForEdit } from '@backend/features/profile/queries'
import { getAdminLang, getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Peran Beranda')} · Home` }
}

// Home → Peran: beranda 1:1 seperti di situs, hanya peran yang diketik langsung di
// pratinjau (dan 141); action dan validasinya tetap saveHeroRoles.
export default async function HeroRolesPage() {
  await requireSuperAdminPage()
  const [roles, profile, portrait, tId, tEn, lang] = await Promise.all([
    getHeroRolesForEdit(),
    getPublicProfile(),
    getHeroPortraitAsset(),
    getTranslations({ locale: 'id', namespace: 'About' }),
    getTranslations({ locale: 'en', namespace: 'About' }),
    getAdminLang(),
  ])
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/roles" />
      <HeroRolesForm
        defaultValues={roles}
        placeholders={{ id: tId('roles'), en: tEn('roles') }}
        name={profile?.name ?? 'Muhammad Mirza'}
        portrait={portrait}
        defaultPortrait={HERO_PORTRAIT}
        header={<SitePreviewHeader locale={lang} currentPath="/" />}
      />
    </>
  )
}
