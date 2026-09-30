import type { Metadata } from 'next'

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
        eyebrow="Konten"
        title="Profil dan hero"
        description="Teks di bagian atas beranda, bio, status ketersediaan, dan link kontak."
      />
      <ProfileForm defaultValues={profile} />
    </>
  )
}
