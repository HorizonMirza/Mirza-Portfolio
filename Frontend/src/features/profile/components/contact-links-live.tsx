'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Globe, Mail, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { InlineInput, LiveErrors, LiveStage, Note, SaveBar } from '@/components/admin/live-edit'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import { cn } from '@/lib/utils'

import { saveContactLinks } from '../actions'
import { type ContactLinksInput, contactLinksSchema } from '../schema'

type Key = 'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram' | 'website' | 'cv'
type FieldName =
  | 'whatsapp'
  | 'email'
  | 'cvUrl'
  | 'socials.linkedin'
  | 'socials.github'
  | 'socials.instagram'
  | 'socials.website'

function Brand({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={BRAND_ICONS[slug].path} />
    </svg>
  )
}

// urutan kartu sama dengan footer situs (components/site/footer-links.ts)
const CARDS: { key: Key; field: FieldName; title: string; icon: ReactNode; placeholder: string }[] =
  [
    {
      key: 'whatsapp',
      field: 'whatsapp',
      title: 'WhatsApp',
      icon: <Brand slug="whatsapp" />,
      placeholder: '+62…',
    },
    {
      key: 'email',
      field: 'email',
      title: 'Email',
      icon: <Mail className="size-5" aria-hidden="true" />,
      placeholder: 'nama@contoh.com',
    },
    {
      key: 'linkedin',
      field: 'socials.linkedin',
      title: 'LinkedIn',
      icon: (
        <span className="w-5 text-center text-[17px] leading-none font-bold" aria-hidden="true">
          in
        </span>
      ),
      placeholder: 'https://linkedin.com/in/…',
    },
    {
      key: 'github',
      field: 'socials.github',
      title: 'GitHub',
      icon: <Brand slug="github" />,
      placeholder: 'https://github.com/…',
    },
    {
      key: 'instagram',
      field: 'socials.instagram',
      title: 'Instagram',
      icon: <Brand slug="instagram" />,
      placeholder: 'https://instagram.com/…',
    },
    {
      key: 'website',
      field: 'socials.website',
      title: 'Situs lain',
      icon: <Globe className="size-5" aria-hidden="true" />,
      placeholder: 'https://…',
    },
  ]

// Admin → Footer, kartu kontak (DESIGN.md bagian 139): kartu tautan seperti di footer situs, nilai
// tiap kartu diketik langsung di tempat alamatnya tampil. Kartu kosong tidak tampil di situs, jadi
// ditandai bergaris putus. Kartu Resume CV: link (mis. Google Drive) diketik di kartu, berkas PDF
// ditekan untuk diunggah atau diganti; link didahulukan bila keduanya ada.
export function ContactLinksLive({
  defaultValues,
  cv,
  configured,
  cvTitle,
}: {
  defaultValues: ContactLinksInput
  cv: AssetView | null
  configured: boolean
  // judul kartu CV di situs (teks Footer.cv)
  cvTitle: string
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cvOpen, setCvOpen] = useState(false)
  const form = useForm<ContactLinksInput>({
    resolver: zodResolver(contactLinksSchema),
    defaultValues,
  })
  const {
    register,
    control,
    formState: { errors },
  } = form
  const v = useWatch({ control })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveContactLinks(values)
      if (applyResult(result, form.setError)) form.reset(values)
    })
  })

  const valueOf = (field: FieldName) =>
    field.startsWith('socials.')
      ? (v.socials?.[field.slice(8) as keyof NonNullable<typeof v.socials>] ?? '')
      : (v[field as 'whatsapp' | 'email' | 'cvUrl'] ?? '')
  const errorOf = (field: FieldName) =>
    field.startsWith('socials.')
      ? errors.socials?.[field.slice(8) as 'linkedin']?.message
      : errors[field as 'whatsapp' | 'email' | 'cvUrl']?.message

  const card = (filled: boolean, primary = false) =>
    cn(
      'grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border px-4 py-3',
      primary && filled
        ? 'border-primary bg-primary text-primary-fg'
        : filled
          ? 'border-border bg-surface'
          : 'border-dashed border-border text-muted',
    )

  const messages = CARDS.flatMap((c) => {
    const e = errorOf(c.field)
    return e ? [{ text: `${t(c.title)}: ${t(e)}` }] : []
  })
  if (errors.cvUrl?.message) messages.push({ text: `${cvTitle}: ${t(errors.cvUrl.message)}` })

  const hasCv = Boolean(v.cvUrl) || Boolean(cv)

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="bg-bg px-4 py-8 text-text sm:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
            <Note>Kartu kontak di footer · kosong = tidak tampil</Note>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {CARDS.map((c) => {
                const value = valueOf(c.field)
                return (
                  <li key={c.key} className={card(Boolean(value))}>
                    {c.icon}
                    <span className="grid min-w-0">
                      <span className="text-sm font-semibold">{t(c.title)}</span>
                      <InlineInput
                        label={t('{name} (opsional)', { name: t(c.title) })}
                        type={c.key === 'email' ? 'email' : c.key === 'whatsapp' ? 'tel' : 'url'}
                        inputMode={
                          c.key === 'email' ? 'email' : c.key === 'whatsapp' ? 'tel' : 'url'
                        }
                        {...register(c.field)}
                        placeholder={c.placeholder}
                        invalid={Boolean(errorOf(c.field))}
                        className="min-h-6 w-full text-[0.8125rem] text-muted"
                      />
                    </span>
                  </li>
                )
              })}
              {/* Resume CV: kartu disorot seperti di situs */}
              <li className={card(hasCv, true)}>
                {/* ikon = tombol berkas PDF */}
                <button
                  type="button"
                  onClick={() => setCvOpen(true)}
                  className="grid size-9 place-items-center rounded-lg outline-offset-2 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-current"
                >
                  {cv ? (
                    <FileText className="size-5" aria-hidden="true" />
                  ) : (
                    <Upload className="size-5" aria-hidden="true" />
                  )}
                  <span className="sr-only">{t('Berkas Resume CV')}</span>
                </button>
                <span className="grid min-w-0">
                  <span className="text-sm font-semibold">{cvTitle}</span>
                  <InlineInput
                    label={t('Link CV (opsional)')}
                    type="url"
                    inputMode="url"
                    {...register('cvUrl')}
                    placeholder={
                      cv ? t('PDF terunggah · atau tempel link') : 'https://drive.google.com/…'
                    }
                    invalid={Boolean(errors.cvUrl)}
                    className={cn(
                      'min-h-6 w-full text-[0.8125rem]',
                      hasCv ? 'text-primary-fg/75 placeholder:text-primary-fg/75' : 'text-muted',
                    )}
                  />
                </span>
              </li>
            </ul>
          </div>
        </LiveStage>
        <LiveErrors messages={messages} />
        <SaveBar pending={pending} />
      </form>
      <AssetEditDialog
        open={cvOpen}
        onClose={() => setCvOpen(false)}
        onDone={() => {
          setCvOpen(false)
          router.refresh()
        }}
        title="Berkas Resume CV"
        description="PDF yang dibuka tombol Resume CV bila Link CV kosong."
        target="profile-cv"
        asset={cv}
        configured={configured}
      />
    </>
  )
}
