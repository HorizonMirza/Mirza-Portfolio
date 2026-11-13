'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { type ReactNode, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangToggle,
  LiveErrors,
  LiveStage,
  SaveBar,
  StateBox,
  useEditLang,
} from '@/components/admin/live-edit'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { saveProfile } from '../actions'
import { type ProfileInput, profileSchema } from '../schema'
import { AboutPhotoCard, type PhotoCardChip } from './about-photo-card'

type LangField = 'headline' | 'bio' | 'currentRole' | 'aboutBandRoles'

// Admin → About (DESIGN.md bagian 136 dan 146): halaman Tentang seperti di situs dalam satu halaman
// (tab Profil dan Pendidikan digabung 2026-11-13): pita (kartu foto, nama, peran), lalu bio dan kartu
// pendidikan berdampingan. Peran dan bio diketik langsung; nama tetap. Foto kartu ditekan untuk
// diganti; kartu pendidikan ditekan untuk membuka entrinya. Chip kampus dan bendera dinyalakan atau
// dimatikan lewat dua tombol selebar Simpan tepat di atasnya. Headline, posisi sekarang, dan kota
// tampil sebagai pratinjau tautan yang dibagikan.
export function ProfileLive({
  defaultValues,
  photo,
  aboutPhoto,
  chip,
  bioHeading,
  rolesFallback,
  configured,
  education,
}: {
  defaultValues: ProfileInput
  // foto yang tampil di kartu (foto kartu About, foto profil, atau bawaan)
  photo: string | StaticImageData
  aboutPhoto: AssetView | null
  chip: Record<Lang, PhotoCardChip> | null
  // judul bagian bio di situs (teks halaman About.title)
  bioHeading: Record<Lang, string>
  // peran yang tampil di situs selama "Peran di halaman Tentang" kosong
  rolesFallback: Record<Lang, string>
  configured: boolean
  // bagian Pendidikan halaman Tentang per bahasa isi (EducationSectionAdmin, dirender server)
  education: Record<Lang, ReactNode>
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [lang, setLang] = useEditLang()
  const [photoOpen, setPhotoOpen] = useState(false)
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues })
  const {
    register,
    control,
    setValue,
    formState: { errors, dirtyFields },
  } = form
  const values = useWatch({ control })
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const name = (f: LangField) => `${f}_${lang}` as const
  const err = (key: string) =>
    (errors as Record<string, { message?: string } | undefined>)[key]?.message
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`

  const onSubmit = form.handleSubmit(
    (submitted) => {
      startTransition(async () => {
        const result = await saveProfile(submitted)
        if (applyResult(result, form.setError)) form.reset(submitted)
      })
    },
    (invalid) => {
      const keys = Object.keys(invalid)
      if (
        !keys.some((k) => k.endsWith(`_${lang}`)) &&
        keys.some((k) => k.endsWith(`_${otherLang}`))
      )
        setLang(otherLang)
    },
  )

  const dirtyLang = (l: Lang) =>
    Object.keys(dirtyFields).some((k) => k.endsWith(`_${l}`) || !/_(id|en)$/.test(k))

  const toggle = (field: 'showCampusChip' | 'showFlag', on: boolean, text: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setValue(field, !on, { shouldDirty: true })}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold',
        on ? 'border-text bg-text text-bg' : 'border-dashed border-border text-muted',
      )}
    >
      {t(text)}
    </button>
  )

  const messages = Object.entries(errors).map(([key, e]) => ({
    id: `${key}-error`,
    text: `${key.replace(/_(id|en)$/, (m) => ` (${t(LANG_NAME[m.slice(1) as Lang])})`)}: ${t(
      (e as { message?: string })?.message ?? '',
    )}`,
  }))

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="relative bg-bg px-4 pt-14 pb-10 text-text sm:px-10">
          <LangToggle
            lang={lang}
            onChange={setLang}
            dirty={{ id: dirtyLang('id'), en: dirtyLang('en') }}
            className="absolute top-3 right-3 z-10"
          />
          <div lang={lang} className="site-ui mx-auto flex max-w-[1100px] flex-col gap-10">
            {/* pita halaman Tentang: kartu foto dan nama + peran, seperti di situs */}
            <div className="ab-band">
              <div className="flex flex-col items-center gap-3">
                {/* garis penanda di bingkai foto saja (pas di tengah foto), bukan di chip */}
                <button
                  type="button"
                  onClick={() => setPhotoOpen(true)}
                  className="admin-photo-edit cursor-pointer rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-current"
                >
                  <AboutPhotoCard
                    photo={
                      <Image
                        placeholder={typeof photo === 'string' ? SHIMMER_PLACEHOLDER : 'empty'}
                        src={photo}
                        alt=""
                        width={480}
                        height={600}
                        sizes="300px"
                        className="ab-pc-photo"
                      />
                    }
                    chip={values.showCampusChip && chip ? chip[lang] : null}
                    flag={values.showFlag ?? true}
                  />
                  {/* nama tombol = teks yang terlihat (chip kampus) + keterangan ini (axe
                      label-content-name-mismatch) */}
                  <span className="sr-only">{t('Ganti foto kartu About')}</span>
                </button>
              </div>
              <div className="ab-band-text">
                {/* nama tidak diubah dari sini (revisi pemilik 2026-11-13) */}
                <p className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] font-bold uppercase">
                  {values.name}
                </p>
                <InlineInput
                  key={name('aboutBandRoles')}
                  label={label('Peran di halaman Tentang')}
                  {...register(name('aboutBandRoles'))}
                  placeholder={rolesFallback[lang]}
                  invalid={Boolean(err(name('aboutBandRoles')))}
                  className="mt-3 block w-full text-lg tracking-wide uppercase opacity-80"
                />
              </div>
            </div>

            {/* bio dan pendidikan berdampingan seperti di situs (.ab-body) */}
            <div className="ab-body">
              <section className="flex flex-col gap-3">
                <p className="ab-label">{bioHeading[lang]}</p>
                <InlineArea
                  key={name('bio')}
                  label={label('Bio')}
                  {...register(name('bio'))}
                  measure={values[name('bio')] ?? ''}
                  invalid={Boolean(err(name('bio')))}
                  className="ab-bio leading-relaxed"
                />
              </section>
              {education[lang]}
            </div>

            <StateBox note="Pratinjau tautan saat dibagikan dan mesin pencari">
              <div className="flex flex-col gap-1 rounded-md border border-border bg-surface p-4 font-sans">
                <InlineArea
                  key={name('headline')}
                  label={label('Headline')}
                  {...register(name('headline'))}
                  measure={values[name('headline')] ?? ''}
                  invalid={Boolean(err(name('headline')))}
                  className="text-lg font-semibold"
                />
                <InlineInput
                  key={name('currentRole')}
                  label={label('Posisi sekarang (opsional)')}
                  {...register(name('currentRole'))}
                  placeholder={t('Posisi sekarang (opsional)')}
                  invalid={Boolean(err(name('currentRole')))}
                  className="block w-full text-sm text-muted"
                />
                <InlineInput
                  label={t('Kota (opsional)')}
                  {...register('city')}
                  placeholder={t('Kota (opsional)')}
                  invalid={Boolean(err('city'))}
                  className="block w-full text-sm text-muted"
                />
              </div>
            </StateBox>
          </div>
        </LiveStage>
        <LiveErrors messages={messages} />
        {/* chip di kartu foto: satu baris selebar Simpan, tepat di atasnya (revisi 2026-11-13) */}
        <div className="admin-bleed grid grid-cols-2 gap-2">
          {toggle('showCampusChip', values.showCampusChip ?? true, 'Chip kampus')}
          {toggle('showFlag', values.showFlag ?? true, 'Chip bendera')}
        </div>
        <SaveBar pending={pending} />
      </form>
      <AssetEditDialog
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onDone={() => {
          setPhotoOpen(false)
          router.refresh()
        }}
        title="Foto kartu About"
        description="Foto di kartu halaman Tentang. Rasio potret sekitar 4:5. Kosong: memakai foto profil (Home)."
        target="about-photo"
        asset={aboutPhoto}
        configured={configured}
      />
    </>
  )
}
