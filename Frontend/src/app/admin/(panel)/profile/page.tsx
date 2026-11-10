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
        title="About"
        description="Nama dan bio di halaman Tentang, headline untuk gambar pratinjau tautan, link kontak, dan CV. Foto profil, foto utama beranda, dan peran diatur di modul Home."
      />
      <ModuleTabs moduleId="about" current="/admin/profile" />
      <div className="flex flex-col gap-6">
        <AssetSlot
          title="CV"
          description="Berkas PDF yang diunduh dari tombol Resume CV."
          target="profile-cv"
          asset={assets.cv}
          configured={configured}
        />
        {/* form teks terakhir: tombol Simpan di bawahnya hanya untuk form ini (CV tersimpan sendiri saat
            diunggah) */}
        <ProfileForm defaultValues={profile} />
      </div>
    </>
  )
}
