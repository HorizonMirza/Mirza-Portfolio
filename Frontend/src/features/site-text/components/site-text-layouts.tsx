'use client'

import { Send } from 'lucide-react'
import type { ReactNode } from 'react'

import { StateBox } from '@/components/admin/live-edit'
import { NavEditProvider } from '@/components/site/nav-edit'
import { Container } from '@/components/site/section-heading'
import { IdLanyard } from '@/components/site/id-lanyard'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { StaticImageData } from 'next/image'

import type { ModuleId } from '../catalog'

import { EditText, SearchSnippet, useShownText } from './site-text-live'

// Tata letak pratinjau per modul (DESIGN.md bagian 151): halaman Navbar, Contact, dan Footer tampil
// 1:1 seperti situs di bingkai layar (SiteFrame), memakai kelas dan susunan yang sama; yang bisa
// diketik diberi garis putus-putus. Keadaan yang tidak tampil di halaman (pesan galat, kartu setelah
// terkirim, keterangan saat kartu disorot) ada di bawah pratinjau.

export type LayoutExtras = {
  name: string
  // Contact: potret kartu ID
  photo: string | StaticImageData
  photoCrop?: { x: number; y: number; w: number; h: number }
  // Navbar: navbar situs yang asli (server), Footer: kartu kontak yang bisa diketik
  header?: ReactNode
  contact?: ReactNode
}

// Kolom form kontak seperti di situs (label + kolom berkilau); kolomnya hanya tampilan
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
        <EditText k={k} />
      </Label>
      <div
        inert
        className="field-shine rounded-md"
        style={{ '--shine-delay': `${-shine * 1.1}s` } as React.CSSProperties}
      >
        {tall ? <Textarea rows={7} readOnly /> : <Input readOnly />}
      </div>
    </div>
  )
}

// Kartu ID bertali yang asli; tulisan di kanvasnya mengikuti teks yang sedang diketik
function LiveLanyard({
  name,
  photo,
  photoCrop,
}: Pick<LayoutExtras, 'name' | 'photo' | 'photoCrop'>) {
  const role = useShownText('Contact.cardRole')
  const site = useShownText('Contact.cardSite')
  return (
    <IdLanyard
      className="hidden lg:mt-[calc(5.75rem+0.2*var(--text-h1))] lg:block"
      name={name}
      role={role}
      photo={photo}
      photoCrop={photoCrop}
      site={site}
    />
  )
}

const CONTACT_ERRORS = [
  'Contact.error',
  'Contact.rateLimited',
  'Contact.invalid',
  'Contact.nameRequired',
  'Contact.nameTooLong',
  'Contact.emailInvalid',
  'Contact.subjectTooLong',
  'Contact.messageShort',
  'Contact.messageLong',
]

function ContactLayout({ name, photo, photoCrop }: LayoutExtras) {
  return (
    <Container className="pb-12">
      <div className="grid lg:grid-cols-[15rem_1fr] lg:gap-16">
        <LiveLanyard name={name} photo={photo} photoCrop={photoCrop} />
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
                <EditText k="Contact.send" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

function ContactBelow() {
  return (
    <>
      {/* kartu ID bertali ada di kanvas (tampil di layar lebar); jabatan dan alamat situsnya diketik di sini */}
      <StateBox note="Tulisan di kartu ID">
        <div className="flex flex-col gap-2">
          <EditText k="Contact.cardRole" block className="min-h-6 text-sm" />
          <EditText k="Contact.cardSite" block className="min-h-6 font-mono text-xs" />
        </div>
      </StateBox>
      <StateBox note="Tombol saat mengirim">
        <EditText k="Contact.sending" />
      </StateBox>
      <StateBox note="Pesan galat formulir">
        <ul className="flex flex-col gap-1.5 text-sm text-danger">
          {CONTACT_ERRORS.map((k) => (
            <li key={k}>
              <EditText k={k} block />
            </li>
          ))}
        </ul>
      </StateBox>
      <StateBox note="Kartu setelah pesan terkirim">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <EditText
              k="Contact.sentTitle"
              className="font-display text-h3 font-semibold uppercase"
            />
            <span className="rounded-full border border-success/45 px-2.5 py-0.5 text-[0.8125rem] font-semibold text-success">
              <EditText k="Contact.sentBadge" />
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {['ticketFrom', 'ticketReplyTo', 'ticketSubject', 'ticketMessage', 'ticketTime'].map(
              (f) => (
                <div key={f} className="contents">
                  <dt className="text-muted">
                    <EditText k={`Contact.${f}`} />
                  </dt>
                  <dd className="pointer-events-none text-muted">…</dd>
                </div>
              ),
            )}
          </dl>
          <span className="inline-flex min-h-11 w-fit items-center text-[0.9375rem] underline underline-offset-4">
            <EditText k="Contact.another" />
          </span>
        </div>
      </StateBox>
      <SearchSnippet path="contact" prefix="Contact" />
    </>
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

function NavbarBelow() {
  return (
    <StateBox note="Nama menu untuk pembaca layar (tidak terlihat)">
      <EditText k="Nav.label" />
    </StateBox>
  )
}

// Footer situs yang asli: judul, kartu kontak (nilainya diketik di kartu), dan hak cipta
function FooterLayout({ contact }: LayoutExtras) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <nav className="mb-4">
          <h2 className="mb-4 font-display text-h3 font-semibold uppercase">
            <EditText
              k="Footer.contactHeading"
              block
              className="font-display text-h3 font-semibold uppercase"
            />
          </h2>
          {contact}
        </nav>
        <p className="text-sm text-muted">
          <EditText k="Footer.copyright" block />
        </p>
      </div>
    </footer>
  )
}

function FooterBelow() {
  return (
    <StateBox note="Keterangan saat kartu disorot (hanya di layar dengan kursor)">
      <ul className="flex flex-col gap-2 text-sm">
        {['whatsappHint', 'emailHint', 'githubHint', 'cvHint', 'cvFile'].map((f) => (
          <li key={f}>
            <EditText k={`Footer.${f}`} block />
          </li>
        ))}
      </ul>
    </StateBox>
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

// keadaan di bawah pratinjau per modul
export function SiteTextBelow({ moduleId }: { moduleId: ModuleId }) {
  switch (moduleId) {
    case 'contact':
      return <ContactBelow />
    case 'navbar':
      return <NavbarBelow />
    case 'footer':
      return <FooterBelow />
    default:
      return null
  }
}
