import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { SettingsForm } from '@/features/settings/components/settings-form'
import { getSettingsForEdit } from '@/features/settings/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  await requireSuperAdminPage()
  const settings = await getSettingsForEdit()
  return (
    <>
      <PageHeader
        eyebrow="Situs"
        title="Pengaturan"
        description="Pengaturan yang berlaku untuk seluruh situs publik."
      />
      <SettingsForm defaultValues={settings} />
    </>
  )
}
