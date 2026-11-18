import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { getPublicProfile } from '@backend/features/profile/public'
import { SiteSettingsList } from '@/features/settings/components/site-settings-list'
import { getSiteOptionsForEdit } from '@backend/features/settings/queries'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengaturan') }
}

// Nama menu tetap "Pengaturan": sekarang berisi pengaturan seluruh situs, bukan hanya suara
// (revisi pemilik 2026-11-11, DESIGN.md bagian 119).
export default async function SettingsPage() {
  await requireSuperAdminPage()
  const [options, profile] = await Promise.all([getSiteOptionsForEdit(), getPublicProfile()])
  return (
    <>
      <PageHeader title="Pengaturan" />
      <SiteSettingsList initial={options} hasWhatsapp={Boolean(profile?.whatsapp)} />
    </>
  )
}
