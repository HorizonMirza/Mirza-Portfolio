'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image, { type StaticImageData } from 'next/image'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { applyResult } from '@/components/admin/apply-result'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  LiveErrors,
  LiveStage,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'
import { Container, PageIntro } from '@/components/site/section-heading'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import { EducationCardsLive } from '@/features/experience/components/education-cards-live'
import { type EntryRow, useEntries } from '@/features/experience/components/use-entries'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { saveProfile } from '../actions'
import { type ProfileInput, profileSchema } from '../schema'
import { AboutPhotoCard, type PhotoCardChip } from './about-photo-card'

type LangField = 'headline' | 'bio' | 'currentRole' | 'aboutBandRoles' | 'aboutChipLabel'

// Admin → About (DESIGN.md bagian 136, 146, dan 147): halaman Tentang sama persis seperti di situs
// (judul, pita berisi kartu foto yang menggantung, nama, peran, lalu bio dan kartu pendidikan
// berdampingan), semuanya diubah di halaman ini. Peran tampil seperti di situs (peran bawaan sebagai
// teks biasa, sama seperti Home → Peran) dan diketik langsung; nama tetap. Foto kartu ditekan untuk
// diganti. Pendidikan diubah, ditambah, dan dihapus langsung di kartunya. Di bawah panggung: Chip
// logo/Chip bendera, lalu pilihan bahasa ID/EN, lalu Simpan (menyimpan profil dan pendidikan).
export function ProfileLive({
  defaultValues,
  photo,
  aboutPhoto,
  chipLogo,
  chip,
  bioHeading,
  rolesFallback,
  configured,
  education,
  educationHeading,
  presentLabel,
}: {
  defaultValues: ProfileInput
  // foto yang tampil di kartu (foto kartu About, foto profil, atau bawaan)
  photo: string | StaticImageData
  aboutPhoto: AssetView | null
  // logo chip yang diunggah (kosong: ikut logo pendidikan terbaru selama teks chip juga kosong)
  chipLogo: AssetView | null
  // isi chip bila teks chip kosong: pendidikan terbaru, sama seperti di situs
  chip: Record<Lang, PhotoCardChip | null>
  // judul halaman dan bagian bio di situs (teks halaman About.title)
  bioHeading: Record<Lang, string>
  // peran yang tampil di situs selama "Peran di halaman Tentang" kosong
  rolesFallback: Record<Lang, string>
  configured: boolean
  // entri pendidikan (diubah langsung di kartu)
  education: EntryRow[]
  educationHeading: Record<Lang, string>
  presentLabel: Record<Lang, string>
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [lang, setLang] = useEditLang()
  // foto dan logo chip ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const entries = useEntries(education)
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues })
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form
  const values = useWatch({ control })
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const name = (f: LangField) => `${f}_${lang}` as const
  const err = (key: string) =>
    (errors as Record<string, { message?: string } | undefined>)[key]?.message
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`
  const roles = values[name('aboutBandRoles')] || rolesFallback[lang]
  // chip: teks dan logo sendiri lebih dulu; teks kosong = ikut pendidikan terbaru
  const showChip = values.showCampusChip ?? true
  const chipFallback = chip[lang]
  const customChip = values[name('aboutChipLabel')] ?? ''
  const chipText = customChip || chipFallback?.name || ''
  const chipLogoUrl = chipLogo?.url ?? (customChip ? null : (chipFallback?.logo?.url ?? null))
  const chipInitials = (chipText.trim()[0] ?? '?').toUpperCase()

  const onSubmit = form.handleSubmit(
    (submitted) => {
      startTransition(async () => {
        const result = await saveProfile(submitted)
        if (applyResult(result, form.setError)) form.reset(submitted)
        // pendidikan yang berubah ikut disimpan
        const edu = await entries.saveAll()
        if (edu.failed > 0) toast.error(t('Periksa kembali isian pendidikan.'))
        if (edu.saved > 0) router.refresh()
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

  const toggle = (field: 'showCampusChip' | 'showFlag', on: boolean, text: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setValue(field, !on, { shouldDirty: true })}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-semibold',
        on ? 'border-text bg-text text-bg' : 'border-border text-muted',
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
        <LiveStage className="bg-bg text-text">
          {/* sama dengan halaman Tentang situs: Container, judul halaman, pita, lalu bio + pendidikan */}
          <Container className="site-ui pb-20">
            <div lang={lang}>
              <PageIntro title={bioHeading[lang]} align="center" />
              <div className="ab-band">
                {/* .ab-tilt: kartu foto menggantung ke bawah pita seperti di situs (tanpa efek miring) */}
                <div className="ab-tilt">
                  {/* garis penanda di bingkai foto saja; foto dan chip masing-masing tombol sendiri */}
                  <AboutPhotoCard
                    className="admin-photo-edit"
                    photo={
                      <div className="group/photo relative">
                        <button
                          type="button"
                          onClick={() => picker.pick('about-photo')}
                          className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                        >
                          <Image
                            placeholder={typeof photo === 'string' ? SHIMMER_PLACEHOLDER : 'empty'}
                            src={photo}
                            alt=""
                            width={480}
                            height={600}
                            sizes="300px"
                            className="ab-pc-photo"
                          />
                          <span className="sr-only">{t('Ganti foto kartu About')}</span>
                        </button>
                        {/* hapus foto kartu: kartu kembali memakai foto profil */}
                        {aboutPhoto ? (
                          <span className="absolute top-2 left-2 z-10 rounded-md bg-bg/80 opacity-0 backdrop-blur transition-opacity group-focus-within/photo:opacity-100 group-hover/photo:opacity-100 max-md:opacity-100">
                            <RemoveAssetButton
                              assetId={aboutPhoto.id}
                              label={t('Foto kartu About')}
                              onDone={() => router.refresh()}
                            />
                          </span>
                        ) : null}
                      </div>
                    }
                    chip={
                      showChip ? (chipFallback ?? { name: '', initials: '?', logo: null }) : null
                    }
                    chipSlot={
                      showChip ? (
                        <>
                          <button
                            type="button"
                            onClick={() => picker.pick('about-chip-logo')}
                            className="ab-pc-logo admin-editable cursor-pointer"
                          >
                            {chipLogoUrl ? (
                              <Image
                                placeholder={SHIMMER_PLACEHOLDER}
                                src={chipLogoUrl}
                                alt=""
                                width={72}
                                height={72}
                                sizes="36px"
                                className="size-full object-cover"
                              />
                            ) : (
                              <span aria-hidden="true">{chipInitials}</span>
                            )}
                            <span className="sr-only">{t('Ganti logo chip')}</span>
                          </button>
                          <InlineInput
                            key={name('aboutChipLabel')}
                            label={label('Teks chip')}
                            value={chipText}
                            placeholder={t('Kampus atau perusahaan')}
                            invalid={Boolean(err(name('aboutChipLabel')))}
                            size={Math.max(10, chipText.length + 1)}
                            maxLength={60}
                            className="min-h-6 min-w-0"
                            onChange={(event) => {
                              const next = event.target.value
                              setValue(
                                name('aboutChipLabel'),
                                next === chipFallback?.name ? '' : next,
                                { shouldDirty: true },
                              )
                            }}
                          />
                          {chipLogo ? (
                            <RemoveAssetButton
                              assetId={chipLogo.id}
                              label={t('Logo chip')}
                              onDone={() => router.refresh()}
                            />
                          ) : null}
                        </>
                      ) : null
                    }
                    flag={values.showFlag ?? true}
                  />
                </div>
                <div className="ab-band-text">
                  {/* nama tidak diubah dari sini (revisi pemilik 2026-11-13) */}
                  <p className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.95] font-bold uppercase">
                    {values.name}
                  </p>
                  {/* peran bawaan tampil sebagai teks biasa seperti di situs; teks yang sama dengan
                      bawaan disimpan kosong (ikut bawaan), sama seperti Home → Peran */}
                  <InlineInput
                    key={name('aboutBandRoles')}
                    label={label('Peran di halaman Tentang')}
                    value={roles}
                    invalid={Boolean(err(name('aboutBandRoles')))}
                    onChange={(event) => {
                      const next = event.target.value
                      setValue(name('aboutBandRoles'), next === rolesFallback[lang] ? '' : next, {
                        shouldDirty: true,
                      })
                    }}
                    className="ab-roles block w-full text-lg tracking-wide uppercase opacity-80"
                  />
                </div>
              </div>

              <div className="ab-body">
                <section className="flex flex-col gap-3.5">
                  <p className="ab-label">{bioHeading[lang]}</p>
                  <InlineArea
                    key={name('bio')}
                    label={label('Bio')}
                    {...register(name('bio'))}
                    measure={values[name('bio')] ?? ''}
                    invalid={Boolean(err(name('bio')))}
                    className="ab-bio"
                  />
                </section>
                <EducationCardsLive
                  entries={entries}
                  lang={lang}
                  heading={educationHeading[lang]}
                  presentLabel={presentLabel[lang]}
                  configured={configured}
                />
              </div>
            </div>
          </Container>
        </LiveStage>
        <LiveErrors messages={messages} />
        {/* chip di kartu foto: satu baris selebar Simpan (revisi 2026-11-13) */}
        <div className="admin-bleed grid grid-cols-2 gap-2">
          {toggle('showCampusChip', values.showCampusChip ?? true, 'Chip logo')}
          {toggle('showFlag', values.showFlag ?? true, 'Chip bendera')}
        </div>
        {/* bahasa isi tepat di atas Simpan, bentuknya sama dengan tombol chip */}
        <LangRow lang={lang} onChange={setLang} />
        <SaveBar pending={pending} />
      </form>
      {picker.element}
    </>
  )
}
