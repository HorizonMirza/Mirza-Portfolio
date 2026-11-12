'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import {
  InlineInput,
  LANG_NAME,
  type Lang,
  LiveErrors,
  SaveBar,
} from '@/components/admin/live-edit'
import { SiteFrame } from '@/components/admin/site-frame'
import { HeroContent } from '@/components/site/hero-content'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import type { AssetView } from '@/features/assets/components/asset-panels'

import { saveHeroRoles } from '../actions'
import { type HeroRolesInput, heroRolesSchema } from '../schema'

function splitRoles(value: string) {
  return value.split('|').map((r) => r.trim())
}

// tempat kosong di tengah dibuang, spasi dirapikan
function clean(value: string | undefined) {
  return splitRoles(value ?? '')
    .filter(Boolean)
    .join(' | ')
}

// Admin → Home, tab Peran (revisi pemilik 2026-11-12, DESIGN.md bagian 141): beranda tampil 1:1
// seperti di situs (navbar dan hero asli di bingkai layar, SiteFrame). Peran di kiri dan kanan bawah
// diketik langsung di tempatnya; bahasanya mengikuti tombol bahasa admin di top bar. Foto utama
// ditekan untuk diganti (tab Foto beranda dihapus). Peran disimpan sebagai satu teks dipisah "|";
// selama kosong situs memakai teks bawaan (About.roles), yang juga tampil di sini; teks yang sama
// dengan bawaan disimpan kosong.
export function HeroRolesForm({
  defaultValues,
  placeholders,
  name,
  portrait,
  defaultPortrait,
  header,
  configured,
}: {
  defaultValues: HeroRolesInput
  // teks bawaan (About.roles) yang tampil di situs selama kolom ini kosong
  placeholders: Record<Lang, string>
  name: string
  portrait: AssetView | null
  defaultPortrait: StaticImageData
  // navbar situs asli (SitePreviewHeader), dirender server dalam bahasa admin
  header: ReactNode
  configured: boolean
}) {
  const t = useAdminT()
  const router = useRouter()
  const { lang } = useAdminLang()
  const [pending, startTransition] = useTransition()
  const [photoOpen, setPhotoOpen] = useState(false)
  const form = useForm<HeroRolesInput>({ resolver: zodResolver(heroRolesSchema), defaultValues })
  const {
    control,
    setValue,
    formState: { errors, isSubmitted },
  } = form
  const field = `aboutRoles_${lang}` as const
  const value = useWatch({ control, name: field }) ?? ''
  // kosong = situs memakai peran bawaan, jadi peran bawaan tampil sebagai teks biasa (1:1 dengan situs)
  const parts = splitRoles(value.trim() ? value : placeholders[lang])
  // minimal dua tempat: kiri dan kanan bawah foto
  const slots = Array.from({ length: Math.max(2, parts.length) }, (_, i) => parts[i] ?? '')
  const error = errors[field]?.message
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const otherError = errors[`aboutRoles_${otherLang}`]?.message

  function update(index: number, text: string) {
    const next = slots.map((s, i) => (i === index ? text : s))
    // tempat kosong di akhir tidak ikut disimpan
    while (next.length > 0 && next[next.length - 1]!.trim() === '') next.pop()
    const joined = next.join(' | ')
    // sama dengan peran bawaan: disimpan kosong agar tetap ikut teks bawaan
    const same = clean(joined) === clean(placeholders[lang])
    setValue(field, same ? '' : joined, { shouldDirty: true, shouldValidate: isSubmitted })
  }

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      aboutRoles_id: clean(values.aboutRoles_id),
      aboutRoles_en: clean(values.aboutRoles_en),
    }
    startTransition(async () => {
      const result = await saveHeroRoles(payload)
      if (applyResult(result, form.setError)) form.reset(payload)
    })
  })

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <SiteFrame>
          {header}
          {/* sama dengan beranda: hero-shell di belakang navbar, isi dari HeroContent */}
          <section className="hero-shell" lang={lang}>
            <div className="hero-mask">
              <HeroContent
                name={name}
                titleTag="p"
                portrait={
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="absolute inset-0 cursor-pointer outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-current"
                  >
                    <Image
                      src={portrait?.url ?? defaultPortrait}
                      {...(portrait
                        ? { width: portrait.width ?? 1120, height: portrait.height ?? 1100 }
                        : {})}
                      alt=""
                      unoptimized
                      loading="eager"
                      draggable={false}
                      className="hero-portrait-img"
                    />
                    <span className="sr-only">{t('Ganti foto utama')}</span>
                  </button>
                }
                roles={
                  <ul className="hero-roles">
                    {slots.map((role, i) => (
                      <li key={`${lang}-${i}`}>
                        <InlineInput
                          label={t('Peran ke-{n} ({lang})', {
                            n: i + 1,
                            lang: t(LANG_NAME[lang]),
                          })}
                          value={role}
                          size={Math.max(4, role.length + 1)}
                          maxLength={120}
                          // area sentuh lebih tinggi tanpa menggeser teks: bingkai diperkecil, jadi
                          // tinggi teks saja kurang dari 24 px (axe target-size)
                          className="-my-2.5 py-2.5"
                          invalid={Boolean(error)}
                          describedBy={error ? `${field}-error` : undefined}
                          onChange={(event) => update(i, event.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                }
              />
            </div>
          </section>
        </SiteFrame>
        <LiveErrors
          messages={[
            ...(error ? [{ id: `${field}-error`, text: t(error) }] : []),
            ...(otherError
              ? [
                  {
                    text: t('Isi {lang}: {error}', {
                      lang: t(LANG_NAME[otherLang]),
                      error: t(otherError),
                    }),
                  },
                ]
              : []),
          ]}
        />
        <SaveBar pending={pending} />
      </form>
      {photoOpen ? (
        <AssetEditDialog
          open
          onClose={() => setPhotoOpen(false)}
          onDone={() => {
            setPhotoOpen(false)
            router.refresh()
          }}
          title="Foto utama"
          description="Foto besar di beranda. WebP, PNG, atau AVIF dengan perbandingan sekitar 1120:1100, lebar minimal 700 px."
          note={
            <>
              {t(
                'Pembingkaian halaman dan gambar armor dihitung dari foto bawaan, jadi pengganti harus dibingkai sama: kepala, wajah, dan tangan di posisi yang sama, rata bawah, latar transparan.',
              )}{' '}
              <a
                href={defaultPortrait.src}
                download
                className="text-text underline underline-offset-4"
              >
                {t('Unduh foto bawaan sebagai acuan')}
              </a>
              . {t('Hapus berkas untuk kembali ke foto bawaan.')}
            </>
          }
          target="hero-portrait"
          asset={portrait}
          configured={configured}
        />
      ) : null}
    </>
  )
}
