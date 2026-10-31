import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getProfileAssets } from '@/features/assets/queries'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { getProfileForEdit } from '@/features/profile/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage() {
  await requireSuperAdminPage()
  const [profile, assets] = await Promise.all([getProfileForEdit(), getProfileAssets()])
  const configured = isUploadConfigured()
  return (
    <>
      <PageHeader
        title="Profil"
        description="Nama, bio dan peran di halaman Tentang (peran juga tampil di pojok bawah hero beranda), headline untuk gambar pratinjau tautan, status ketersediaan, dan link kontak. Foto hero beranda diatur di modul Home."
      />
      <ModuleTabs moduleId="about" current="/admin/profile" />
      <div className="flex flex-col gap-6">
        <ProfileForm defaultValues={profile} />
        <div className="grid gap-6 lg:grid-cols-2">
          <AssetSlot
            title="Foto profil"
            description="Tampil di avatar navbar dan footer, kartu halaman Tentang, dan kartu lanyard halaman Kontak. Rasio persegi atau potret."
            target="profile-photo"
            asset={assets.photo}
            configured={configured}
          />
          <AssetSlot
            title="CV"
            description="Berkas PDF yang diunduh dari tombol Resume CV."
            target="profile-cv"
            asset={assets.cv}
            configured={configured}
          />
        </div>
      </div>
    </>
  )
}
