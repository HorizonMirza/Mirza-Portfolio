'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRight, FileText, Mail, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { InlineInput, LiveErrors } from '@/components/admin/live-edit'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { useRegisterExtraSave } from '@/features/site-text/components/site-text-live'
import { BRAND_ICONS } from '@/features/skills/brand-icons'
import { cn } from '@/lib/utils'

import { saveContactLinks } from '../actions'
import { type ContactLinksInput, contactLinksSchema } from '../schema'

type Key = 'whatsapp' | 'email' | 'linkedin' | 'github' | 'instagram' | 'cv'
type FieldName =
  'whatsapp' | 'email' | 'cvUrl' | 'socials.linkedin' | 'socials.github' | 'socials.instagram'

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
  ]

// Admin → Footer, kartu kontak (DESIGN.md bagian 139 dan 151): kartu tautan seperti di footer situs,
// nilai tiap kartu diketik langsung di tempat alamatnya tampil. Dipasang di dalam pratinjau Footer
// (SiteTextLive) tanpa form dan tombol Simpan sendiri: disimpan bersama teks footer lewat satu
// tombol Simpan. Kartu kosong tidak tampil di situs, jadi ditandai bergaris putus. Kartu Resume CV:
// link (mis. Google Drive) diketik di kartu, berkas PDF ditekan untuk diunggah atau diganti; link
// didahulukan bila keduanya ada.
export function ContactLinksLive({
  defaultValues,
  cv,
  configured,
  cvTitle,
}: {
  defaultValues: ContactLinksInput
  cv: AssetView | null
  configured: boolean
  // judul kartu CV di situs (teks Footer.cv), bisa berupa isian yang diketik langsung
  cvTitle: ReactNode
}) {
  const t = useAdminT()
  const router = useRouter()
  // ikon PDF ditekan: langsung membuka pemilih berkas (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const form = useForm<ContactLinksInput>({
    resolver: zodResolver(contactLinksSchema),
    defaultValues,
  })
  const {
    register,
    control,
    formState: { errors, isDirty },
  } = form
  const v = useWatch({ control })

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
  if (errors.cvUrl?.message)
    messages.push({ text: `${t('Berkas Resume CV')}: ${t(errors.cvUrl.message)}` })

  const hasCv = Boolean(v.cvUrl) || Boolean(cv)

  return (
    <>
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
                  inputMode={c.key === 'email' ? 'email' : c.key === 'whatsapp' ? 'tel' : 'url'}
                  {...register(c.field)}
                  placeholder={c.placeholder}
                  invalid={Boolean(errorOf(c.field))}
                  className="min-h-6 w-full text-[0.8125rem] text-muted"
                />
              </span>
              <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
            </li>
          )
        })}
        {/* Resume CV: kartu disorot seperti di situs */}
        <li className={card(hasCv, true)}>
          {/* ikon = tombol berkas PDF */}
          <button
            type="button"
            onClick={() => picker.pick('profile-cv')}
            className="admin-editable grid size-9 place-items-center rounded-lg outline-offset-2 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-current"
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
                {t('Buka berkas')}
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
      {picker.element}
    </>
  )
}
