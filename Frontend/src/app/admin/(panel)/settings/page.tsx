import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { SoundForm } from '@/features/settings/components/sound-form'
import { getSoundForEdit } from '@/features/settings/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  await requireSuperAdminPage()
  const sound = await getSoundForEdit()
  return (
    <>
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Pengaturan teknis yang berlaku untuk seluruh situs publik. Teks, foto, dan kartu pembuka ada di menu Halaman situs."
      />
      <SoundForm defaultValues={sound} />
    </>
  )
}
