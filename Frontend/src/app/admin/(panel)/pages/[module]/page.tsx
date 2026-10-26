import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getHeroAssets } from '@/features/assets/queries'
import { IntroForm } from '@/features/settings/components/intro-form'
import { getIntroForEdit } from '@/features/settings/queries'
import { findModule, type ModuleId } from '@/features/site-text/catalog'
import { SiteTextForm } from '@/features/site-text/components/site-text-form'
import { getDefaultTexts, getTextsForEdit } from '@/features/site-text/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { HERO_ARMOR, HERO_PORTRAIT } from '@/lib/default-photo'
import { isUploadConfigured } from '@/lib/uploads'

type Params = { params: Promise<{ module: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = findModule((await params).module)
  return { title: found?.label ?? 'Halaman situs' }
}

// Satu halaman admin per modul situs publik. Teks dua bahasa dari daftar di features/site-text/catalog.ts;
// modul tertentu menambah bagian khusus (kartu pembuka, foto hero).
export default async function SiteModulePage({ params }: Params) {
  await requireSuperAdminPage()
  const found = findModule((await params).module)
  if (!found) notFound()
  const moduleId: ModuleId = found.id
  const [texts, defaults] = await Promise.all([
    getTextsForEdit(moduleId),
    getDefaultTexts(moduleId),
  ])

  return (
    <>
      <PageHeader eyebrow="Halaman situs" title={found.title} description={found.description} />
      <div className="flex flex-col gap-6">
        {moduleId === 'intro' ? <IntroForm defaultValues={await getIntroForEdit()} /> : null}
        {moduleId === 'home' ? <HeroPhotos /> : null}
        <SiteTextForm moduleId={moduleId} initialValues={texts.values} defaults={defaults} />
      </div>
    </>
  )
}

async function HeroPhotos() {
  const hero = await getHeroAssets()
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
    </>
  )
}
