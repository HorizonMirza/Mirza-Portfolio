'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRight, FileText, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { cvLabel, derivedCardValue } from '@backend/features/profile/footer-links'
import { InlineInput, LiveErrors } from '@/components/admin/live-edit'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import type { AssetView } from '@backend/features/assets/asset-view'
import { useRegisterExtraSave } from '@/features/site-text/components/site-text-live'
import { CLIENT_ICON_PATHS, type ClientIconSlug } from '@/features/skills/client-icon-paths'
import { cn } from '@/lib/utils'

import { saveContactLinks } from '@backend/features/profile/actions'
import { type ContactLinksInput, contactLinksSchema } from '@backend/features/profile/schema'

type Key = 'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram'
type SocialKey = 'linkedin' | 'github' | 'instagram'
type FieldName =
  'whatsapp' | 'email' | 'cvUrl' | 'socials.linkedin' | 'socials.github' | 'socials.instagram'

function Brand({ slug }: { slug: ClientIconSlug }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={CLIENT_ICON_PATHS[slug]} />
    </svg>
  )
}

// urutan kartu sama dengan footer situs (Backend/features/profile/footer-links.ts). Judul kartu tetap
// (tidak bisa diubah); WhatsApp dan Email satu isian (nomor/alamat sekaligus yang tampil), akun sosial
// dua isian (nama yang tampil dan tautan).
const CARDS: {
  key: Key
  field: FieldName
  title: string
  icon: ReactNode
  placeholder: string
}[] = [
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
]

const isSocial = (key: Key): key is SocialKey =>
  key === 'linkedin' || key === 'github' || key === 'instagram'

// Admin → Footer, kartu kontak (revisi 2026-11-12 dan 2026-11-15, dan 161): kartu tautan seperti di footer
// situs, diketik langsung di tempatnya. Dipasang di dalam pratinjau Footer (SiteTextLive) tanpa form
// dan tombol Simpan sendiri: disimpan bersama teks footer lewat satu tombol Simpan. Kartu kosong tidak
// tampil di situs, jadi ditandai bergaris putus. Judul kartu (WhatsApp, Email, ...) tetap. WhatsApp
// dan Email hanya satu isian. LinkedIn, GitHub, dan Instagram punya nama yang tampil dan tautan.
// Kartu Resume CV: ikon dan keterangan ("Google Drive") tetap, hanya link yang diketik.
export function ContactLinksLive({
  defaultValues,
  cv,
  cvTitle,
}: {
  defaultValues: ContactLinksInput
  cv: AssetView | null
  // judul kartu CV di situs (teks Footer.cv), bisa berupa isian yang diketik langsung
  cvTitle: ReactNode
}) {
  const t = useAdminT()
  const router = useRouter()
  const form = useForm<ContactLinksInput>({
    resolver: zodResolver(contactLinksSchema),
    defaultValues,
  })
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = form
  const v = useWatch({ control })

  // isian kontak dari nilai form (dengan satu kolom diganti), untuk nama bawaan akun sosial
  const linksOf = (field?: FieldName, next?: string) => {
    const get = (name: FieldName) =>
      (name === field ? next : undefined) ??
      (name.startsWith('socials.')
        ? (v.socials?.[name.slice(8) as 'linkedin'] ?? '')
        : (v[name as 'whatsapp' | 'email' | 'cvUrl'] ?? ''))
    return {
      socials: {
        linkedin: get('socials.linkedin'),
        github: get('socials.github'),
        instagram: get('socials.instagram'),
      },
    }
  }
  // tautan diganti: nama yang masih bawaan (atau kosong) ikut berganti, yang sudah diubah admin dibiarkan
  const followLink =
    (key: SocialKey, field: FieldName) => (event: { target: { value: string } }) => {
      const path = `labels.${key}.value` as const
      const before = derivedCardValue(key, linksOf())
      const current = getValues(path) ?? ''
      if (current === '' || current === before)
        setValue(path, derivedCardValue(key, linksOf(field, event.target.value)), {
          shouldDirty: true,
        })
    }

  // disimpan bersama teks footer oleh tombol Simpan halaman; tanpa ubahan dilewati
  useRegisterExtraSave(async () => {
    if (!isDirty) return true
    let saved = false
    await form.handleSubmit(async (values) => {
      const result = await saveContactLinks(values)
      if (applyResult(result, form.setError)) {
        form.reset(values)
        saved = true
      }
    })()
    return saved
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
      'grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3',
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
  for (const c of CARDS.filter((c) => isSocial(c.key))) {
    const e = errors.labels?.[c.key as SocialKey]?.value?.message
    if (e) messages.push({ text: `${t(c.title)}: ${t(e)}` })
  }
  if (errors.cvUrl?.message)
    messages.push({ text: `${t('Berkas Resume CV')}: ${t(errors.cvUrl.message)}` })

  const hasCv = Boolean(v.cvUrl) || Boolean(cv)
  // keterangan kartu CV seperti di situs; tidak bisa diubah
  const cvHost = (() => {
    try {
      return v.cvUrl ? new URL(v.cvUrl).hostname.replace(/^www\./, '') : null
    } catch {
      return null
    }
  })()
  const cvShown = v.cvUrl ? cvLabel(cvHost, 'PDF') : cv ? 'PDF' : ''
  const cvDrive = cvShown === 'Google Drive'

  return (
    <>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const value = valueOf(c.field)
          const kind = c.key === 'email' ? 'email' : c.key === 'whatsapp' ? 'tel' : 'url'
          return (
            <li key={c.key} className={card(Boolean(value))}>
              {c.icon}
              <span className="grid min-w-0 gap-2">
                <span className="text-sm font-semibold">{t(c.title)}</span>
                {isSocial(c.key) ? (
                  <InlineInput
                    wrap
                    label={t('Teks Kartu {name}', { name: t(c.title) })}
                    {...register(`labels.${c.key}.value`)}
                    maxLength={80}
                    invalid={Boolean(errors.labels?.[c.key]?.value)}
                    className="min-h-6 w-full text-[0.8125rem] text-muted"
                  />
                ) : null}
                {(() => {
                  const reg = register(c.field, {
                    onChange: isSocial(c.key) ? followLink(c.key, c.field) : undefined,
                  })
                  return (
                    <InlineInput
                      wrap
                      label={t('{name} (Opsional)', { name: t(c.title) })}
                      type={kind}
                      inputMode={kind}
                      {...reg}
                      placeholder={c.placeholder}
                      invalid={Boolean(errorOf(c.field))}
                      className={cn(
                        'min-h-6 w-full text-muted',
                        isSocial(c.key) ? 'font-mono text-xs' : 'text-[0.8125rem]',
                      )}
                    />
                  )
                })()}
              </span>
              <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
            </li>
          )
        })}
        {/* Resume CV: kartu disorot seperti di situs; ikon dan keterangan tetap, hanya link diketik */}
        <li className={card(hasCv, true)}>
          {cvDrive ? (
            <Brand slug="googledrive" />
          ) : (
            <FileText className="size-5" aria-hidden="true" />
          )}
          <span className="grid min-w-0 gap-2">
            <span className="text-sm font-semibold">{cvTitle}</span>
            {(() => {
              const reg = register('cvUrl')
              return (
                <InlineInput
                  wrap
                  label={t('Link CV (Opsional)')}
                  type="url"
                  inputMode="url"
                  {...reg}
                  placeholder={
                    cv ? t('PDF terunggah · atau tempel link') : 'https://drive.google.com/…'
                  }
                  invalid={Boolean(errors.cvUrl)}
                  className={cn(
                    'min-h-6 w-full font-mono text-xs',
                    hasCv ? 'text-primary-fg/75 placeholder:text-primary-fg/75' : 'text-muted',
                  )}
                />
              )
            })()}
          </span>
          <ArrowUpRight
            className={cn('size-4', hasCv ? 'text-primary-fg/75' : 'text-muted')}
            aria-hidden="true"
          />
          {cv ? (
            <span className="col-start-2 flex items-center gap-1 text-xs">
              <a
                href={cv.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {t('Buka Berkas')}
                <span className="sr-only">{t('(membuka tab baru)')}</span>
              </a>
              <RemoveAssetButton
                assetId={cv.id}
                label={t('Berkas Resume CV')}
                onDone={() => router.refresh()}
              />
            </span>
          ) : null}
        </li>
      </ul>
      <LiveErrors messages={messages} />
    </>
  )
}
