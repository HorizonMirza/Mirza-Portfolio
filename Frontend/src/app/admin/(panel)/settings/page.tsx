import type { Metadata } from 'next'

import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getHeroAssets } from '@/features/assets/queries'
import { SettingsForm } from '@/features/settings/components/settings-form'
import { getSettingsForEdit } from '@/features/settings/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'
import { HERO_ARMOR, HERO_PORTRAIT } from '@/lib/default-photo'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  await requireSuperAdminPage()
  const [settings, hero] = await Promise.all([getSettingsForEdit(), getHeroAssets()])
  const configured = isUploadConfigured()
  const template = (href: string) => (
    <>
      Pembingkaian halaman dihitung dari foto bawaan, jadi pengganti harus dibingkai sama: kepala,
      wajah, dan tangan di posisi yang sama, rata bawah, latar transparan.{' '}
      <a href={href} download className="text-primary underline underline-offset-4">
        Unduh foto bawaan sebagai acuan
      </a>
      . Hapus berkas untuk kembali ke foto bawaan.
    </>
  )
  return (
    <>
      <PageHeader
        eyebrow="Situs"
        title="Pengaturan"
        description="Pengaturan yang berlaku untuk seluruh situs publik."
      />
      <div className="flex flex-col gap-6">
        <SettingsForm defaultValues={settings} />
        <AssetSlot
          title="Potret hero"
          description="Foto besar di beranda. WebP, PNG, atau AVIF dengan perbandingan sekitar 1120:1100, lebar minimal 700 px."
          note={template(HERO_PORTRAIT.src)}
          target="hero-portrait"
          asset={hero.portrait}
          configured={configured}
        />
        <AssetSlot
          title="Armor hero"
          description="Gambar kedua yang terbuka saat kursor menyapu hero. Perbandingan sekitar 1280:1300 (lebih besar 80 px kiri-kanan dan 200 px di atas potret), lebar minimal 800 px. Ganti bersama potret agar pasangannya sejajar."
          note={template(HERO_ARMOR.src)}
          target="hero-armor"
          asset={hero.armor}
          configured={configured}
        />
      </div>
    </>
  )
}
