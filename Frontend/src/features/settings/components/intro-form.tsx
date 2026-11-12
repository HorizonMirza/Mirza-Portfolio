'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, House, Pencil } from 'lucide-react'
import { type ReactNode, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { FormFooter } from '@/components/admin/form-footer'
import { cn } from '@/lib/utils'

import { saveIntroNotice } from '../actions'
import { type IntroInput, introSchema } from '../schema'

type Lang = 'id' | 'en'

// Teks tetap kartu per bahasa (messages/*.json namespace Intro), disiapkan server
export type IntroPreviewTexts = Record<
  Lang,
  { eyebrow: string; title: string; downloadCv: string; home: string }
>

const MAX = 600
const LANG_NAME: Record<Lang, string> = { id: 'Indonesia', en: 'Inggris' }

// Pratinjau isi seperti di kartu: paragraf dan **tebal** saja (situs memakai MarkdownView yang
// disanitasi di server). Dibangun sebagai elemen React, tanpa HTML mentah.
function previewBody(source: string): ReactNode {
  return source
    .split(/\n{2,}/)
    .filter((part) => part.trim() !== '')
    .map((part, i) => (
      <p key={i} className={i > 0 ? 'mt-3' : undefined}>
        {part
          .split(/(\*\*[^*]+\*\*)/)
          .map((piece, k) =>
            piece.startsWith('**') && piece.endsWith('**') && piece.length > 4 ? (
              <strong key={k}>{piece.slice(2, -2)}</strong>
            ) : (
              piece
            ),
          )}
      </p>
    ))
}

// Admin → Home, tab Kartu pembuka (revisi pemilik 2026-11-12, DESIGN.md bagian 131): kartu
// "Informasi Penting" tampil seperti yang dilihat pengunjung. Tombol ID/EN di kartu memilih bahasa
// yang diubah; isi kartu ditekan untuk mengubahnya di tempat, lalu Simpan di bawah kartu. Judul,
// label, dan tombol kartu tetap (hanya pratinjau, tidak bisa ditekan).
export function IntroForm({
  defaultValues,
  texts,
  hasCv,
}: {
  defaultValues: IntroInput
  texts: IntroPreviewTexts
  hasCv: boolean
}) {
  const t = useAdminT()
  const [pending, startTransition] = useTransition()
  const [lang, setLang] = useState<Lang>('id')
  const [editing, setEditing] = useState(false)
  const form = useForm<IntroInput>({ resolver: zodResolver(introSchema), defaultValues })
  const {
    register,
    control,
    formState: { errors, dirtyFields },
  } = form
  const name = `introBody_${lang}` as const
  const value = useWatch({ control, name }) ?? ''
  const card = texts[lang]
  const error = errors[name]?.message
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const otherError = errors[`introBody_${otherLang}`]?.message
  const field = register(name)

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await saveIntroNotice(values)
        if (applyResult(result, form.setError)) {
          form.reset(values)
          setEditing(false)
        }
      })
    },
    // isian yang salah ada di bahasa lain: kartu pindah ke bahasa itu agar galatnya terlihat
    (invalid) => {
      if (!invalid[`introBody_${lang}`] && invalid[`introBody_${otherLang}`]) setLang(otherLang)
      setEditing(true)
    },
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {/* panggung hitam seperti latar kartu di situs; di HP selebar panel agar kartu selebar di situs */}
      <div className="-mx-4 flex justify-center bg-black py-6 sm:mx-0 sm:rounded-2xl sm:px-4 sm:py-14">
        <div className="intro-card login-card" lang={lang}>
          <div className="intro-panel">
            <div aria-hidden="true" className="intro-grain" />
            <div className="intro-box text-white">
              <div className="flex items-center justify-between gap-4">
                <p className="intro-eyebrow font-mono uppercase">{card.eyebrow}</p>
                <div role="group" aria-label={t('Bahasa yang diubah')} className="intro-lang">
                  {(['id', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={l === lang}
                      onClick={() => setLang(l)}
                      className="relative"
                    >
                      {l.toUpperCase()}
                      {/* titik: bahasa ini sudah diubah dan belum disimpan */}
                      {dirtyFields[`introBody_${l}`] ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-1 right-1 size-1.5 rounded-full bg-current"
                        />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
              <p className="intro-title" aria-hidden="true">
                {card.title}
              </p>
              {editing ? (
                <>
                  <label htmlFor={name} className="sr-only">
                    {t('Isi kartu pembuka ({lang})', { lang: t(LANG_NAME[lang]) })}
                  </label>
                  <textarea
                    key={name}
                    id={name}
                    rows={6}
                    autoFocus
                    maxLength={MAX}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${name}-hint${error ? ` ${name}-error` : ''}`}
                    {...field}
                    // tetap dalam mode ubah sampai disimpan atau Esc: menutup saat blur menggeser
                    // tombol Simpan tepat ketika ditekan sehingga kliknya hilang
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setEditing(false)
                    }}
                    className={cn(
                      'intro-body block w-full resize-y rounded-md bg-white/5 p-2 text-left text-white outline-none',
                      'focus-visible:ring-2 focus-visible:ring-white/60',
                      error && 'ring-2 ring-red-300',
                    )}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-describedby={`${name}-hint${error ? ` ${name}-error` : ''}`}
                  className={cn(
                    'group relative -m-2 block w-[calc(100%+1rem)] rounded-md p-2 text-left transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-2 focus-visible:outline-white/60',
                    error && 'ring-2 ring-red-300',
                  )}
                >
                  <span className="sr-only">
                    {t('Ubah isi kartu ({lang})', { lang: t(LANG_NAME[lang]) })}
                  </span>
                  <span className="intro-body block" aria-hidden="true">
                    {value.trim() ? (
                      previewBody(value)
                    ) : (
                      <span className="text-white/40 italic">
                        {t('Tekan untuk menulis isi kartu')}
                      </span>
                    )}
                  </span>
                  <Pencil
                    aria-hidden="true"
                    className="absolute -top-3 -right-3 size-6 rounded-full bg-white p-1.5 text-black opacity-70 transition-opacity group-hover:opacity-100"
                  />
                </button>
              )}
              {/* tombol kartu hanya pratinjau */}
              <div
                aria-hidden="true"
                className={cn(
                  'pointer-events-none',
                  hasCv ? 'intro-actions intro-actions-2' : 'intro-actions',
                )}
              >
                {hasCv ? (
                  <span className="intro-btn intro-btn-primary">
                    <FileText />
                    {card.downloadCv}
                  </span>
                ) : null}
                <span className="intro-btn intro-btn-secondary">
                  <House />
                  {card.home}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <p id={`${name}-hint`} className="text-muted">
          {t(
            'Tekan isi kartu untuk mengubahnya dan Esc untuk melihat hasilnya; pilih ID atau EN di kartu untuk bahasa lain. Tulis **teks** untuk huruf tebal. {count}/{max} karakter.',
            { count: value.length, max: MAX },
          )}
        </p>
        {error ? (
          <p id={`${name}-error`} className="text-danger">
            {t(error)}
          </p>
        ) : null}
        {otherError ? (
          <p className="text-danger">
            {t('Isi {lang}: {error}', { lang: t(LANG_NAME[otherLang]), error: t(otherError) })}
          </p>
        ) : null}
      </div>
      <FormFooter pending={pending} />
    </form>
  )
}
