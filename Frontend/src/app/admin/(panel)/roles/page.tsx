import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { HeroRolesForm } from '@/features/profile/components/hero-roles-form'
import { getHeroRolesForEdit } from '@/features/profile/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: `${t('Peran beranda')} · Home` }
}

// Home → Peran beranda: peran di bawah foto utama beranda. Dipisah dari tab foto (revisi pemilik
// 2026-11-11, DESIGN.md bagian 129); action dan validasinya tetap saveHeroRoles.
export default async function HeroRolesPage() {
  await requireSuperAdminPage()
  const [roles, tId, tEn] = await Promise.all([
    getHeroRolesForEdit(),
    getTranslations({ locale: 'id', namespace: 'About' }),
    getTranslations({ locale: 'en', namespace: 'About' }),
  ])
  return (
    <>
      <PageHeader title="Home" />
      <ModuleTabs moduleId="home" current="/admin/roles" />
      <HeroRolesForm defaultValues={roles} placeholders={{ id: tId('roles'), en: tEn('roles') }} />
    </>
  )
}
