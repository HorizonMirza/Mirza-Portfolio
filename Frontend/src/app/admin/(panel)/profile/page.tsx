import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { getProfileForEdit } from '@/features/profile/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  await requireSuperAdminPage()
  const profile = await getProfileForEdit()
  return (
    <>
      <PageHeader
        title="About"
        description="Nama dan bio di halaman Tentang, dan headline untuk gambar pratinjau tautan. Kontak dan Resume CV diatur di Footer; foto profil, foto utama beranda, dan peran beranda di Home."
      />
      <ModuleTabs moduleId="about" current="/admin/profile" />
      <ProfileForm defaultValues={profile} />
    </>
  )
}
