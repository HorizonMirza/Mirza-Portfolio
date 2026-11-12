'use client'

import { ArrowLeft, ExternalLink, FileText, GitBranch, Mail, MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'

import type { ModuleId } from '../catalog'
import { Note, StateBox } from '@/components/admin/live-edit'

import { EditText, SearchSnippet } from './site-text-live'

// Tata letak pratinjau per modul (DESIGN.md bagian 135). Meniru susunan dan huruf halaman situs;
// isi data (riwayat, project) diganti contoh singkat karena yang diubah di sini hanya teksnya.

function PageTitle({ k, intro }: { k: string; intro?: string }) {
  return (
    <header className="text-center">
      <EditText k={k} block className="text-center text-h1 font-bold" />
      {intro ? (
        <EditText k={intro} className="mx-auto mt-4 max-w-prose text-center text-muted" />
      ) : null}
    </header>
  )
}

function Sample({ children }: { children: ReactNode }) {
  // contoh isi yang bukan bagian dari teks halaman: redup dan tidak bisa diketik
  return <div className="pointer-events-none text-muted select-none">{children}</div>
}

function ExperienceLayout() {
  const t = useAdminT()
  return (
    <>
      <PageTitle k="Experience.title" />
      <section className="flex flex-col gap-3 border-l-2 border-border pl-6">
        <Note>Contoh riwayat</Note>
        <p className="text-sm text-muted">
          <span className="pointer-events-none">Jan 2024 – </span>
          <EditText k="Experience.present" className="text-text" />
        </p>
        <Sample>
          <p className="font-semibold">{t('Posisi')}</p>
          <p className="text-sm text-muted">{t('Organisasi')}</p>
        </Sample>
      </section>
      <StateBox note="Tampil bila belum ada pengalaman">
        <EditText k="Experience.none" className="text-muted" />
      </StateBox>
      <SearchSnippet path="experience" prefix="Experience" />
    </>
  )
}

function ProjectsLayout() {
  const t = useAdminT()
  return (
    <>
      <PageTitle k="Projects.title" />
      <StateBox note="Tampil bila belum ada project">
        <EditText k="Projects.empty" className="text-muted" />
      </StateBox>
      <section className="flex flex-col gap-4 rounded-md border border-border p-5">
        <Note>Halaman detail project</Note>
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <EditText k="Projects.back" />
        </p>
        <Sample>
          <p className="text-h2 font-bold">{t('Nama project')}</p>
        </Sample>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-sm font-semibold text-bg">
            <ExternalLink className="size-4" aria-hidden="true" />
            <EditText k="Projects.demo" />
          </span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold">
            <GitBranch className="size-4" aria-hidden="true" />
            <EditText k="Projects.repo" />
          </span>
        </div>
        <EditText k="Projects.stack" block className="text-h3 font-semibold" />
        <Sample>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full border border-border px-3 py-1">TypeScript</span>
            <span className="rounded-full border border-border px-3 py-1">Next.js</span>
          </div>
        </Sample>
      </section>
      <SearchSnippet path="projects" prefix="Projects" />
    </>
  )
}

function FieldMock({ k, tall = false }: { k: string; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <EditText k={k} className="text-sm font-semibold" />
      <div className={`rounded-md border border-border ${tall ? 'h-24' : 'h-11'}`} />
    </div>
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

function ContactLayout({ name }: { name: string }) {
  return (
    <>
      <PageTitle k="Contact.title" intro="Contact.intro" />
      <div className="grid gap-8 md:grid-cols-[18rem_1fr]">
        {/* kartu ID */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center">
          <Note>Kartu ID</Note>
          <div className="pointer-events-none size-20 rounded-full bg-surface-2" />
          <p className="font-semibold">{name}</p>
          <EditText k="Contact.cardRole" block className="text-center text-sm text-muted" />
          <div className="mt-2 w-full border-t border-dashed border-border pt-2 font-mono text-xs">
            <EditText k="Contact.cardSite" block className="text-center" />
          </div>
        </div>
        {/* formulir */}
        <div className="flex flex-col gap-4">
          <FieldMock k="Contact.name" />
          <FieldMock k="Contact.email" />
          <FieldMock k="Contact.subject" />
          <FieldMock k="Contact.message" tall />
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-11 items-center rounded-full bg-text px-6 text-sm font-semibold text-bg">
              <EditText k="Contact.send" />
            </span>
            <span className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-semibold">
              <EditText k="Contact.sending" />
            </span>
          </div>
        </div>
      </div>
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
            <EditText k="Contact.sentTitle" className="text-h3 font-semibold" />
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
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
          <span className="inline-flex min-h-11 w-fit items-center rounded-full border border-border px-5 text-sm font-semibold">
            <EditText k="Contact.another" />
          </span>
        </div>
      </StateBox>
      <SearchSnippet path="contact" prefix="Contact" />
    </>
  )
}

function NavbarLayout() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-border bg-surface px-4 py-2">
        <div className="pointer-events-none size-9 rounded-full bg-surface-2" />
        <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold">
          {['home', 'about', 'experience', 'projects', 'contact'].map((k) => (
            <EditText key={k} k={`Nav.${k}`} />
          ))}
        </nav>
        <div className="pointer-events-none size-9 rounded-full border border-border" />
      </div>
      <StateBox note="Nama menu untuk pembaca layar (tidak terlihat)">
        <EditText k="Nav.label" />
      </StateBox>
    </>
  )
}

function FooterLayout() {
  const hints: [string, ReactNode][] = [
    ['Footer.whatsappHint', <MessageCircle key="w" className="size-5" aria-hidden="true" />],
    ['Footer.emailHint', <Mail key="e" className="size-5" aria-hidden="true" />],
    ['Footer.cvHint', <FileText key="c" className="size-5" aria-hidden="true" />],
    ['Footer.githubHint', <GitBranch key="g" className="size-5" aria-hidden="true" />],
  ]
  return (
    <footer className="flex flex-col items-center gap-6 border-t border-border pt-8 text-center">
      <EditText k="Footer.contactHeading" block className="text-center text-h3 font-semibold" />
      <div className="flex flex-wrap justify-center gap-6">
        {hints.map(([k, icon]) => (
          <div key={k} className="flex flex-col items-center gap-2">
            <span className="inline-flex size-12 items-center justify-center rounded-full border border-border">
              {icon}
            </span>
            {/* petunjuk yang muncul saat ikon disorot */}
            <span className="rounded-md bg-text px-2 py-1 text-xs text-bg">
              <EditText k={k} />
            </span>
          </div>
        ))}
      </div>
      <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-sm font-semibold text-bg">
        <FileText className="size-4" aria-hidden="true" />
        <EditText k="Footer.cv" />
        <span className="font-normal">
          <EditText k="Footer.cvFile" />
        </span>
      </span>
      <EditText k="Footer.copyright" block className="text-center text-sm text-muted" />
    </footer>
  )
}

export function SiteTextLayout({ moduleId, name }: { moduleId: ModuleId; name: string }) {
  switch (moduleId) {
    case 'experience':
      return <ExperienceLayout />
    case 'projects':
      return <ProjectsLayout />
    case 'contact':
      return <ContactLayout name={name} />
    case 'navbar':
      return <NavbarLayout />
    case 'footer':
      return <FooterLayout />
    default:
      return null
  }
}
