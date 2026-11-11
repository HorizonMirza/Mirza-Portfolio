import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { SoundForm } from '@/features/settings/components/sound-form'
import { getSoundForEdit } from '@/features/settings/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pengaturan') }
}

export default async function SettingsPage() {
  await requireSuperAdminPage()
  const sound = await getSoundForEdit()
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Pengaturan teknis yang berlaku untuk seluruh situs publik. Teks, foto, dan kartu pembuka ada di menu Halaman situs."
      />
      <SoundForm defaultValues={sound} />
    </>
  )
}
