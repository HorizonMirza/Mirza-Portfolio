import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isTabbedModule, ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { HomePhotosEditor } from '@/features/assets/components/home-photos-editor'
import { getHeroPortraitAsset, getProfileAssets } from '@/features/assets/queries'
import { ContactLinksLive } from '@/features/profile/components/contact-links-live'
import { getPublicProfile } from '@/features/profile/public'
import { getContactLinksForEdit } from '@/features/profile/queries'
import { IntroForm, type IntroPreviewTexts } from '@/features/settings/components/intro-form'
import { getIntroForEdit } from '@/features/settings/queries'
import { findModule, type ModuleId } from '@/features/site-text/catalog'
import { SiteTextLayout } from '@/features/site-text/components/site-text-layouts'
import { SiteTextLive } from '@/features/site-text/components/site-text-live'
import { getDefaultTexts, getTextsForEdit } from '@/features/site-text/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { DEFAULT_PROFILE_AVATAR, HERO_PORTRAIT } from '@/lib/default-photo'
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
      {/* tanpa deskripsi: tab dan pratinjau langsung di atas (revisi pemilik 2026-11-12) */}
      <PageHeader title={inHome ? 'Home' : found.title} />
      {isTabbedModule(tabsOf) ? (
        <ModuleTabs moduleId={tabsOf} current={`/admin/pages/${moduleId}`} />
      ) : null}
      <div className="flex flex-col gap-6">
        {/* Bagian Awal dan Home hanya mengelola yang diminta pemilik (2026-11-10): isi kartu
            pembuka; foto profil, foto utama, dan peran. Teks lain di keduanya tetap. */}
        {moduleId === 'intro' ? <IntroEditor /> : null}
        {moduleId === 'home' ? <HomePhotos /> : null}
        {moduleId !== 'intro' && moduleId !== 'home' ? <ModuleTexts moduleId={moduleId} /> : null}
        {moduleId === 'footer' ? <FooterContacts /> : null}
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
  const profile = moduleId === 'contact' ? await getPublicProfile() : null
  return (
    <SiteTextLive moduleId={moduleId} initialValues={texts.values} defaults={defaults}>
      <SiteTextLayout moduleId={moduleId} name={profile?.name ?? 'Muhammad Mirza'} />
    </SiteTextLive>
  )
}

// Home → Foto beranda: hero seperti di situs, foto ditekan untuk diganti (DESIGN.md bagian 133)
async function HomePhotos() {
  const [profileAssets, portrait, profile] = await Promise.all([
    getProfileAssets(),
    getHeroPortraitAsset(),
    getPublicProfile(),
  ])
  return (
    <HomePhotosEditor
      name={profile?.name ?? 'Muhammad Mirza'}
      profilePhoto={profileAssets.photo}
      heroPortrait={portrait}
      defaultAvatar={DEFAULT_PROFILE_AVATAR}
      defaultPortrait={HERO_PORTRAIT}
      configured={isUploadConfigured()}
    />
  )
}

// Admin → Footer: kartu kontak dan Resume CV seperti di footer situs, diketik langsung (DESIGN.md
// bagian 139), di bawah teks footer
async function FooterContacts() {
  const [links, assets, footer] = await Promise.all([
    getContactLinksForEdit(),
    getProfileAssets(),
    getTranslations({ locale: 'id', namespace: 'Footer' }),
  ])
  return (
    <ContactLinksLive
      defaultValues={links}
      cv={assets.cv}
      configured={isUploadConfigured()}
      cvTitle={footer('cv')}
    />
  )
}
