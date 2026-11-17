'use client'

import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { IdLanyard } from '@/components/site/id-lanyard'
import { NavEditProvider } from '@/components/site/nav-edit'
import { Container } from '@/components/site/section-heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'

import type { ModuleId } from '../catalog'

import { EditText, ShownText, useShownText } from './site-text-live'

// Tata letak pratinjau per modul (DESIGN.md bagian 152): halaman Navbar, Contact, dan Footer tampil
// 1:1 seperti situs di bingkai layar (SiteFrame), memakai kelas dan susunan yang sama. Hanya yang
// memang diubah admin yang berupa isian bergaris putus-putus: nama menu (Navbar), foto, jabatan,
// judul, dan pengantar (Contact), nilai kartu kontak (Footer). Tulisan lain tampil apa adanya.

export type LayoutExtras = {
  name: string
  // Contact: foto kartu ID (alamat gambar), potongannya, berkas dari admin, dan apakah unggah aktif
  photo: string
  photoCrop?: { x: number; y: number; w: number; h: number }
  photoAsset: AssetView | null
  uploadConfigured: boolean
  // Navbar: navbar situs yang asli (server), Footer: kartu kontak yang bisa diketik
  header?: ReactNode
  contact?: ReactNode
}

// Kolom form kontak seperti di situs (label + kolom berkilau); label dan kolomnya hanya tampilan
function MockField({
  k,
  shine,
  tall = false,
  className,
}: {
  k: string
  shine: number
  tall?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <Label>
        <ShownText k={k} />
      </Label>
      <div
        inert
        className="field-shine rounded-md"
        style={{ '--shine-delay': `${-shine * 1.1}s` } as CSSProperties}
      >
        {tall ? <Textarea rows={7} readOnly /> : <Input readOnly />}
      </div>
    </div>
  )
}

// Kartu ID kanvas yang asli (bisa ditarik); foto dan jabatan di kartu ditekan untuk diubah
function ContactLayout({ name, photo, photoCrop, photoAsset, uploadConfigured }: LayoutExtras) {
  const t = useAdminT()
  const router = useRouter()
  const picker = useAssetPicker({ configured: uploadConfigured, onDone: () => router.refresh() })
  const role = useShownText('Contact.cardRole')
  const site = useShownText('Contact.cardSite')
  return (
    <Container className="pb-12">
      <div className="grid lg:grid-cols-[15rem_1fr] lg:gap-16">
        <IdLanyard
          className="hidden lg:mt-[calc(5.75rem+0.2*var(--text-h1))] lg:block"
          name={name}
          role={role}
          photo={photo}
          photoCrop={photoCrop}
          site={site}
          editable={{
            onPhoto: () => picker.pick('contact-photo'),
            // jabatan diketik di tempat tulisannya di kartu (kartu diam di pratinjau admin)
            roleSlot: (
              <div style={{ ['--editable-color' as string]: '#fff' }}>
                <EditText
                  k="Contact.cardRole"
                  className="block h-[18px] max-w-full font-sans text-[10.5px] leading-[18px] font-semibold text-white/70 uppercase"
                />
              </div>
            ),
            photoTools: (
              <span className="flex items-center rounded-md bg-black/50">
                <button
                  type="button"
                  onClick={() => picker.pick('contact-photo')}
                  className="sr-only focus-visible:not-sr-only focus-visible:px-2 focus-visible:py-1 focus-visible:text-xs focus-visible:text-white"
                >
                  {t('Ganti Foto Kartu ID')}
                </button>
                {photoAsset ? (
                  <RemoveAssetButton
                    assetId={photoAsset.id}
                    label={t('Foto Kartu ID')}
                    onDone={() => router.refresh()}
                  />
                ) : null}
              </span>
            ),
          }}
        />
        <div className="contact-col">
          <header className="pt-12 pb-10 md:pt-20">
            <h1 className="mt-3 max-w-3xl text-h1 font-bold">
              <EditText k="Contact.title" block className="text-h1 font-bold" />
            </h1>
            <p className="mt-4 max-w-prose text-muted">
              <EditText k="Contact.intro" block />
            </p>
          </header>
          <div className="relative flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <MockField k="Contact.name" shine={0} />
              <MockField k="Contact.email" shine={1} />
            </div>
            <MockField k="Contact.subject" shine={2} />
            <MockField k="Contact.message" shine={3} tall />
            <div className="flex">
              <span className="send-btn" data-state="idle">
                <Send className="size-[18px]" aria-hidden="true" />
                <ShownText k="Contact.send" />
              </span>
            </div>
          </div>
        </div>
      </div>
      {picker.element}
    </Container>
  )
}

// Navbar situs yang asli (server) dengan nama menu yang bisa diketik
function NavbarLayout({ header }: LayoutExtras) {
  return (
    <NavEditProvider render={(key) => <EditText k={`Nav.${key}`} />}>
      <div className="pb-6">{header}</div>
    </NavEditProvider>
  )
}

// Footer situs yang asli: judul dan hak cipta tampil apa adanya; hanya nilai kartu kontak yang diketik
function FooterLayout({ name, contact }: LayoutExtras) {
  const copyright = useShownText('Footer.copyright')
    .replace('{year}', String(new Date().getFullYear()))
    .replace('{name}', name)
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <nav className="mb-4">
          <h2 className="mb-4 font-display text-h3 font-semibold uppercase">
            <ShownText k="Footer.contactHeading" />
          </h2>
          {contact}
        </nav>
        <p className="text-sm text-muted">{copyright}</p>
      </div>
    </footer>
  )
}

export function SiteTextLayout({ moduleId, extras }: { moduleId: ModuleId; extras: LayoutExtras }) {
  switch (moduleId) {
    case 'contact':
      return <ContactLayout {...extras} />
    case 'navbar':
      return <NavbarLayout {...extras} />
    case 'footer':
      return <FooterLayout {...extras} />
    default:
      return null
  }
}
