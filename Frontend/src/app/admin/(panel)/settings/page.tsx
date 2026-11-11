import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { getPublicProfile } from '@/features/profile/public'
import { SiteSettingsList } from '@/features/settings/components/site-settings-list'
import { getSiteOptionsForEdit } from '@/features/settings/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { getEmailConfig } from '@/lib/email'

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
      <SiteSettingsList
        initial={options}
        emailReady={getEmailConfig() !== null}
        hasWhatsapp={Boolean(profile?.whatsapp)}
      />
    </>
  )
}
