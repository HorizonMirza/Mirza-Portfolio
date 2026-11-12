import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isTabbedModule, ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { AssetSlot } from '@/features/assets/components/asset-panels'
import { getHeroPortraitAsset, getProfileAssets } from '@/features/assets/queries'
import { ContactLinksForm } from '@/features/profile/components/contact-links-form'
import { getPublicProfile } from '@/features/profile/public'
import { getContactLinksForEdit } from '@/features/profile/queries'
import { IntroForm, type IntroPreviewTexts } from '@/features/settings/components/intro-form'
import { getIntroForEdit } from '@/features/settings/queries'
import { findModule, type ModuleId } from '@/features/site-text/catalog'
import { SiteTextForm } from '@/features/site-text/components/site-text-form'
import { getDefaultTexts, getTextsForEdit } from '@/features/site-text/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { HERO_PORTRAIT } from '@/lib/default-photo'
import { isUploadConfigured } from '@/lib/uploads'

type Params = { params: Promise<{ module: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = findModule((await params).module)
  const { t } = await getAdminT()
  if (found?.id === 'intro') return { title: `${t('Kartu pembuka')} · Home` }
  if (found?.id === 'home') return { title: `${t('Foto beranda')} · Home` }
  return { title: t(found?.label ?? 'Halaman situs') }
}

// Satu halaman admin per modul situs publik. Teks dua bahasa dari daftar di features/site-text/catalog.ts;
// Bagian Awal (isi kartu pembuka) dan Home (foto dan peran) memakai form khusus tanpa teks lain.
// Bagian Awal tampil sebagai tab di Home (revisi pemilik 2026-11-11): judul dan tab milik Home.
export default async function SiteModulePage({ params }: Params) {
  await requireSuperAdminPage()
  const found = findModule((await params).module)
  if (!found) notFound()
  const moduleId: ModuleId = found.id
  // Bagian Awal dan Home satu kelompok tab Home, tanpa deskripsi (revisi pemilik 2026-11-11)
  const inHome = moduleId === 'intro' || moduleId === 'home'
  const tabsOf = inHome ? 'home' : moduleId

  return (
    <>
      <PageHeader
        title={inHome ? 'Home' : found.title}
        description={inHome ? undefined : found.description}
      />
      {isTabbedModule(tabsOf) ? (
        <ModuleTabs moduleId={tabsOf} current={`/admin/pages/${moduleId}`} />
      ) : null}
      <div className="flex flex-col gap-6">
        {/* Bagian Awal dan Home hanya mengelola yang diminta pemilik (2026-11-10): isi kartu
            pembuka; foto profil, foto utama, dan peran. Teks lain di keduanya tetap. */}
        {moduleId === 'intro' ? <IntroEditor /> : null}
        {moduleId === 'home' ? <HomePhotos /> : null}
        {moduleId === 'footer' ? <FooterContacts /> : null}
        {moduleId !== 'intro' && moduleId !== 'home' ? <ModuleTexts moduleId={moduleId} /> : null}
      </div>
    </>
  )
}

// Home → Kartu pembuka: kartu seperti di situs, isinya diubah di tempat (DESIGN.md bagian 131)
async function IntroEditor() {
  const [values, profile, tId, tEn] = await Promise.all([
    getIntroForEdit(),
    getPublicProfile(),
    getTranslations({ locale: 'id', namespace: 'Intro' }),
    getTranslations({ locale: 'en', namespace: 'Intro' }),
  ])
  const name = profile?.name ?? 'Muhammad Mirza'
  const texts = Object.fromEntries(
    (
      [
        ['id', tId],
        ['en', tEn],
      ] as const
    ).map(([lang, intro]) => [
      lang,
      {
        // teks situs publik (messages/*.json), bukan teks admin
        eyebrow: intro('eyebrow', { name }),
        title: intro('title'),
        downloadCv: intro('downloadCv'),
        home: intro('home'),
      },
    ]),
  ) as IntroPreviewTexts
  return <IntroForm defaultValues={values} texts={texts} hasCv={profile?.hasCv ?? false} />
}

async function ModuleTexts({ moduleId }: { moduleId: ModuleId }) {
  const [texts, defaults] = await Promise.all([
    getTextsForEdit(moduleId),
    getDefaultTexts(moduleId),
  ])
  return <SiteTextForm moduleId={moduleId} initialValues={texts.values} defaults={defaults} />
}

// Home → Foto beranda: foto profil dan foto utama (peran pindah ke tab sendiri, /admin/roles)
async function HomePhotos() {
  const { t } = await getAdminT()
  const [profileAssets, portrait] = await Promise.all([getProfileAssets(), getHeroPortraitAsset()])
  const configured = isUploadConfigured()
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <AssetSlot
          title="Foto profil"
          description="Foto bulat di kiri atas. Juga tampil di footer, kartu halaman Tentang, dan kartu ID halaman Kontak. Rasio persegi atau potret."
          target="profile-photo"
          asset={profileAssets.photo}
          configured={configured}
        />
        <AssetSlot
          title="Foto utama"
          description="Foto besar di beranda. WebP, PNG, atau AVIF dengan perbandingan sekitar 1120:1100, lebar minimal 700 px."
          note={
            <>
              {t(
                'Pembingkaian halaman dan gambar armor dihitung dari foto bawaan, jadi pengganti harus dibingkai sama: kepala, wajah, dan tangan di posisi yang sama, rata bawah, latar transparan.',
              )}{' '}
              <a
                href={HERO_PORTRAIT.src}
                download
                className="text-primary underline underline-offset-4"
              >
                {t('Unduh foto bawaan sebagai acuan')}
              </a>
              . {t('Hapus berkas untuk kembali ke foto bawaan.')}
            </>
          }
          target="hero-portrait"
          asset={portrait}
          configured={configured}
        />
      </div>
    </>
  )
}

// Admin → Footer: kontak dan Resume CV (dipindah dari About → Profil 2026-11-10), di atas teks footer
async function FooterContacts() {
  const [links, assets] = await Promise.all([getContactLinksForEdit(), getProfileAssets()])
  return (
    <>
      <ContactLinksForm defaultValues={links} />
      <AssetSlot
        title="Berkas Resume CV"
        description="PDF yang dibuka tombol Resume CV bila Link CV di atas kosong."
        target="profile-cv"
        asset={assets.cv}
        configured={isUploadConfigured()}
      />
    </>
  )
}
