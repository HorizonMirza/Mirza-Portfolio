import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isTabbedModule, ModuleTabs } from '@/components/admin/module-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SitePreviewHeader } from '@/components/admin/site-preview-header'
import { getContactPhotoAsset, getProfileAssets } from '@/features/assets/queries'
import { ContactLinksLive } from '@/features/profile/components/contact-links-live'
import { getPublicProfile } from '@/features/profile/public'
import { getContactLinksForEdit } from '@/features/profile/queries'
import { IntroForm, type IntroPreviewTexts } from '@/features/settings/components/intro-form'
import { getIntroForEdit } from '@/features/settings/queries'
import { findModule, type ModuleId } from '@/features/site-text/catalog'
import {
  type LayoutExtras,
  SiteTextLayout,
} from '@/features/site-text/components/site-text-layouts'
import { ShownText, SiteTextLive } from '@/features/site-text/components/site-text-live'
import { getDefaultTexts, getTextsForEdit } from '@/features/site-text/queries'
import { getSiteSettings } from '@/features/settings/public'
import { getAdminLang, getAdminT } from '@/lib/admin-lang-server'
import { HERO_CARD_CROP, HERO_PORTRAIT } from '@/lib/default-photo'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { isUploadConfigured } from '@/lib/uploads'

type Params = { params: Promise<{ module: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = findModule((await params).module)
  const { t } = await getAdminT()
  if (found?.id === 'intro') return { title: `${t('Kartu pembuka')} · Home` }
  return { title: t(found?.label ?? 'Halaman situs') }
}

// Satu halaman admin per modul situs publik. Teks dua bahasa dari daftar di features/site-text/catalog.ts;
// Bagian Awal (isi kartu pembuka) memakai form khusus dan tampil sebagai tab di Home (revisi pemilik
// 2026-11-11). Tab Foto beranda dihapus 2026-11-12: alamat lamanya diarahkan ke tab Peran, tempat
// foto utama kini diganti.
export default async function SiteModulePage({ params }: Params) {
  await requireSuperAdminPage()
  const found = findModule((await params).module)
  if (!found) notFound()
  const moduleId: ModuleId = found.id
  if (moduleId === 'home') redirect('/admin/roles')
  // About tanpa tab Teks halaman (revisi pemilik 2026-11-12, DESIGN.md bagian 142): teksnya tetap
  // tampil di situs (bawaan atau yang tersimpan sebelumnya), hanya tidak diubah dari admin lagi
  if (moduleId === 'about') redirect('/admin/profile')
  // Experience juga tanpa tab Teks halaman (revisi pemilik 2026-11-13, DESIGN.md bagian 145)
  if (moduleId === 'experience') redirect('/admin/experience')
  // Projects juga (revisi pemilik 2026-11-15, DESIGN.md bagian 149)
  if (moduleId === 'projects') redirect('/admin/projects')
  // Bagian Awal satu kelompok tab dengan Home, tanpa deskripsi (revisi pemilik 2026-11-11)
  const inHome = moduleId === 'intro'
  const tabsOf = inHome ? 'home' : moduleId

  return (
    <>
      {/* tanpa deskripsi: tab dan pratinjau langsung di atas (revisi pemilik 2026-11-12) */}
      <PageHeader title={inHome ? 'Home' : found.title} />
      {isTabbedModule(tabsOf) ? (
        <ModuleTabs moduleId={tabsOf} current={`/admin/pages/${moduleId}`} />
      ) : null}
      <div className="flex flex-col gap-6">
        {/* Bagian Awal hanya mengelola isi kartu pembuka (permintaan pemilik 2026-11-10) */}
        {moduleId === 'intro' ? <IntroEditor /> : <ModuleTexts moduleId={moduleId} />}
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
  const lang = await getAdminLang()
  const [texts, defaults, profile, settings, contactPhoto] = await Promise.all([
    getTextsForEdit(moduleId),
    getDefaultTexts(moduleId),
    getPublicProfile(),
    getSiteSettings(),
    moduleId === 'contact' ? getContactPhotoAsset() : null,
  ])
  const name = profile?.name ?? 'Muhammad Mirza'
  // Navbar, Contact, dan Footer tampil 1:1 seperti situs di bingkai layar (DESIGN.md bagian 151)
  const extras: LayoutExtras = {
    name,
    photo: contactPhoto?.url ?? settings.heroPortrait?.url ?? HERO_PORTRAIT.src,
    // foto dari admin dipakai utuh; potret hero dipotong kepala dan bahu (sama dengan situs)
    photoCrop: contactPhoto ? undefined : HERO_CARD_CROP,
    photoAsset: contactPhoto,
    uploadConfigured: isUploadConfigured(),
    header:
      moduleId === 'navbar' ? (
        <SitePreviewHeader locale={lang} currentPath="/" editable />
      ) : undefined,
    contact: moduleId === 'footer' ? await footerContacts() : undefined,
  }
  return (
    <SiteTextLive
      moduleId={moduleId}
      initialValues={texts.values}
      defaults={defaults}
      frame
      // Footer: tanpa teks yang diubah per bahasa, hanya kartu kontak
      languages={moduleId !== 'footer'}
      saveTexts={moduleId !== 'footer'}
    >
      <SiteTextLayout moduleId={moduleId} extras={extras} />
    </SiteTextLive>
  )
}

// Footer: kartu kontak dan Resume CV seperti di footer situs, diketik langsung di pratinjau dan
// disimpan bersama teks footer (DESIGN.md bagian 139 dan 151)
async function footerContacts() {
  const [links, assets] = await Promise.all([getContactLinksForEdit(), getProfileAssets()])
  return (
    <ContactLinksLive
      defaultValues={links}
      cv={assets.cv}
      configured={isUploadConfigured()}
      cvTitle={<ShownText k="Footer.cv" />}
    />
  )
}
