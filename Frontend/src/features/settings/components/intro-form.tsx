'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, House } from 'lucide-react'
import { useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import { LANG_NAME, type Lang, SaveBar } from '@/components/admin/live-edit'
import { cn } from '@/lib/utils'

import { saveIntroNotice } from '../actions'
import { type IntroInput, introSchema } from '../schema'

// Teks tetap kartu per bahasa (messages/*.json namespace Intro), disiapkan server
export type IntroPreviewTexts = Record<
  Lang,
  { eyebrow: string; title: string; downloadCv: string; home: string }
>

const MAX = 600

// Admin → Home, tab Kartu pembuka (revisi pemilik 2026-11-12, DESIGN.md bagian 131-132): kartu
// "Informasi Penting" tampil seperti yang dilihat pengunjung, di panggung hitam selebar panel. Isi
// kartu langsung bisa diketik di tempatnya, tanpa kotak isian dan tanpa ikon (hanya kursor
// berkedip), seperti mengetik di kolom pesan. Tombol ID/EN di kartu memilih bahasa yang diubah.
// Judul, label, dan tombol kartu tetap (hanya pratinjau, tidak bisa ditekan). Simpan satu baris
// penuh di bawah kartu.
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
  const { ref: fieldRef, ...field } = register(name)
  const area = useRef<HTMLTextAreaElement | null>(null)

  // tinggi kotak ketik mengikuti isinya, jadi tampak seperti teks kartu biasa
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value, lang])

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await saveIntroNotice(values)
        if (applyResult(result, form.setError)) form.reset(values)
      })
    },
    // isian yang salah ada di bahasa lain: kartu pindah ke bahasa itu agar galatnya terlihat
    (invalid) => {
      if (!invalid[`introBody_${lang}`] && invalid[`introBody_${otherLang}`]) setLang(otherLang)
    },
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* panggung hitam seperti latar kartu di situs, selebar panel isi sampai tepi kiri-kanan */}
      <div className="admin-bleed flex justify-center rounded-md bg-black px-0 py-8 sm:px-4 sm:py-16">
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
              <label htmlFor={name} className="sr-only">
                {t('Isi kartu pembuka ({lang})', { lang: t(LANG_NAME[lang]) })}
              </label>
              {/* teks kartu yang bisa diketik langsung: tanpa latar, bingkai, atau ikon */}
              <textarea
                key={name}
                id={name}
                rows={3}
                maxLength={MAX}
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${name}-error` : undefined}
                {...field}
                ref={(el) => {
                  fieldRef(el)
                  area.current = el
                }}
                className="intro-body intro-type block w-full resize-none overflow-hidden border-0 bg-transparent p-0"
              />
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
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {t(error)}
        </p>
      ) : null}
      {otherError ? (
        <p className="text-sm text-danger">
          {t('Isi {lang}: {error}', { lang: t(LANG_NAME[otherLang]), error: t(otherError) })}
        </p>
      ) : null}
      <SaveBar pending={pending} />
    </form>
  )
}
