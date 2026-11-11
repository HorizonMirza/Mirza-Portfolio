import type { Metadata } from 'next'

import { ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getProfileAssets } from '@/features/assets/queries'
import { ProfileForm } from '@/features/profile/components/profile-form'
import { getProfileForEdit } from '@/features/profile/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Profil') }
}

export default async function ProfilePage() {
  await requireSuperAdminPage()
  const [profile, assets] = await Promise.all([getProfileForEdit(), getProfileAssets()])
  return (
    <>
      <PageHeader
        title="About"
        description="Kartu dan teks halaman Tentang: foto kartu, nama, peran, bio, chip kampus dan bendera, dan headline untuk gambar pratinjau tautan. Kontak dan Resume CV diatur di Footer; foto profil, foto utama, dan peran beranda di Home."
      />
      <ModuleTabs moduleId="about" current="/admin/profile" />
      <div className="flex flex-col gap-6">
        <AssetSlot
          title="Foto kartu About"
          description="Foto di kartu halaman Tentang. Rasio potret sekitar 4:5. Kosong: memakai foto profil (Home)."
          target="about-photo"
          asset={assets.aboutPhoto}
          configured={isUploadConfigured()}
        />
        {/* form teks terakhir: tombol Simpan di bawahnya hanya untuk form ini (foto tersimpan sendiri
            saat diunggah) */}
        <ProfileForm defaultValues={profile} />
      </div>
    </>
  )
}
