import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { getHeroPortraitAsset } from '@/features/assets/queries'
import { HeroRolesForm } from '@/features/profile/components/hero-roles-form'
import { getPublicProfile } from '@/features/profile/public'
import { getHeroRolesForEdit } from '@/features/profile/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { HERO_PORTRAIT } from '@/lib/default-photo'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Peran beranda')} · Home` }
}

// Home → Peran beranda: peran di bawah foto utama beranda, diketik langsung di pratinjau hero
// (DESIGN.md bagian 129 dan 133); action dan validasinya tetap saveHeroRoles.
export default async function HeroRolesPage() {
  await requireSuperAdminPage()
  const [roles, profile, portrait, tId, tEn] = await Promise.all([
    getHeroRolesForEdit(),
    getPublicProfile(),
    getHeroPortraitAsset(),
    getTranslations({ locale: 'id', namespace: 'About' }),
    getTranslations({ locale: 'en', namespace: 'About' }),
  ])
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/roles" />
      <HeroRolesForm
        defaultValues={roles}
        placeholders={{ id: tId('roles'), en: tEn('roles') }}
        name={profile?.name ?? 'Muhammad Mirza'}
        portrait={portrait?.url ?? HERO_PORTRAIT}
      />
    </>
  )
}
