// Admin → Pengaturan: suara, tampilan, pesan, privasi, dan mode perawatan.

import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { SiteSettingsList } from '@/features/settings/components/site-settings-list'

import { getPublicProfile } from '@backend/features/profile/public'
import { getSiteOptionsForEdit } from '@backend/features/settings/queries'
import { getAdminT } from '@backend/lib/admin-lang-server'
import { requireSuperAdminPage } from '@backend/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengaturan') }
}

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
