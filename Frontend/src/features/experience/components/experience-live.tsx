'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
  useEditLang,
} from '@/components/admin/live-edit'
import { AssetEditDialog } from '@/features/assets/components/asset-edit-dialog'
import type { AssetView } from '@/features/assets/components/asset-panels'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { saveExperience } from '../actions'
import {
  employmentTypeLabel,
  type ExperienceInput,
  experienceSchema,
  type ExperienceKind,
  experienceTypeLabel,
  initials,
  kindBasePath,
} from '../schema'

type Slot = 'logo' | 'photo'

function thisMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Admin → Pengalaman / Pendidikan, halaman satu entri (DESIGN.md bagian 137): entri tampil seperti di
// timeline situs (kelas .xp-tl: logo, peran, instansi · jenis, periode, uraian, foto atau tahun).
// Teks dan bulan diketik langsung; logo dan foto ditekan untuk diganti. Jenis, status, dan titik
// cerita berupa tombol kecil di atas entri. Pendidikan: jenjang/jurusan dan Grade/GPA.
export function ExperienceLive({
  experienceId,
  defaultValues,
  kind = 'experience',
  assets,
  configured,
  presentLabel,
}: {
  experienceId: string | null
  defaultValues: ExperienceInput
  kind?: ExperienceKind
  assets: { logo: AssetView | null; photo: AssetView | null }
  configured: boolean
  // kata "Sekarang" situs per bahasa (Experience.present)
  presentLabel: Record<Lang, string>
}) {
  const t = useAdminT()
  const router = useRouter()
  const education = kind === 'education'
  const basePath = kindBasePath[kind]
  const [pending, startTransition] = useTransition()
  const [lang, setLang] = useEditLang()
  const [slot, setSlot] = useState<Slot | null>(null)
  const form = useForm<ExperienceInput>({ resolver: zodResolver(experienceSchema), defaultValues })
  const {
    register,
    control,
    setValue,
    formState: { errors, dirtyFields },
  } = form
  const v = useWatch({ control })
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const err = (key: string) =>
    (errors as Record<string, { message?: string } | undefined>)[key]?.message
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await saveExperience(experienceId, values)
        if (!applyResult(result, form.setError) || !result.ok) return
        if (experienceId) form.reset(values)
        else if (result.data) router.replace(`${basePath}/${result.data.id}`)
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

  const pill = (on: boolean, text: string, onClick: () => void) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold',
        on ? 'border-text bg-text text-bg' : 'border-border text-muted hover:text-text',
      )}
    >
      {t(text)}
    </button>
  )
  // isian tanpa kolom ketik (jenis, status, titik cerita, bulan selesai)
  const set = (
    key: 'type' | 'status' | 'inStory' | 'endMonth',
    value: ExperienceInput['type'] | ExperienceInput['status'] | boolean | string,
  ) => setValue(key, value as never, { shouldDirty: true })

  // logo dan foto baru bisa diunggah setelah entri tersimpan (butuh id)
  const assetButton = (which: Slot, child: React.ReactNode, className?: string) => (
    <button
      type="button"
      disabled={!experienceId}
      title={experienceId ? undefined : t('Simpan dulu untuk menambah logo dan foto')}
      onClick={() => setSlot(which)}
      className={cn(
        'admin-editable cursor-pointer outline-offset-4 hover:outline-2 hover:outline-current/30 focus-visible:outline-2 focus-visible:outline-current disabled:cursor-not-allowed',
        className,
      )}
    >
      {child}
      <span className="sr-only">
        {t(which === 'logo' ? 'Ganti logo instansi' : 'Ganti foto kegiatan')}
      </span>
    </button>
  )

  const messages = Object.entries(errors).map(([key, e]) => ({
    text: `${key.replace(/_(id|en)$/, (m) => ` (${t(LANG_NAME[m.slice(1) as Lang])})`)}: ${t(
      (e as { message?: string })?.message ?? '',
    )}`,
  }))
  const orgName = lang === 'en' ? v.organization_en || v.organization : v.organization
  const dirtyLang = (l: Lang) =>
    Object.keys(dirtyFields).some((k) => k.endsWith(`_${l}`) || !/_(id|en)$/.test(k))

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="relative bg-bg px-4 pt-6 pb-10 text-text sm:px-10">
          <div className="mb-8 flex flex-wrap items-center gap-2 pr-28">
            <Link
              // pendidikan kini bagian halaman About (2026-11-13)
              href={education ? '/admin/profile' : basePath}
              className="mr-2 inline-flex min-h-9 items-center gap-2 text-sm text-muted hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t(education ? 'Semua pendidikan' : 'Semua pengalaman')}
            </Link>
            {education
              ? null
              : (['WORK', 'ORGANIZATION'] as const).map((type) =>
                  pill(v.type === type, experienceTypeLabel[type], () => set('type', type)),
                )}
            {pill(v.status === 'PUBLISHED', 'Terbit', () => set('status', 'PUBLISHED'))}
            {pill(v.status === 'DRAFT', 'Draf', () => set('status', 'DRAFT'))}
            {education
              ? null
              : pill(Boolean(v.inStory), 'Titik cerita', () => set('inStory', !v.inStory))}
          </div>
          <LangToggle
            lang={lang}
            onChange={setLang}
            dirty={{ id: dirtyLang('id'), en: dirtyLang('en') }}
            className="absolute top-3 right-3"
          />

          <ol className="xp-tl admin-xp-edit mx-auto max-w-[1000px]" lang={lang}>
            <li>
              {assetButton(
                'logo',
                assets.logo ? (
                  <Image
                    placeholder={SHIMMER_PLACEHOLDER}
                    src={assets.logo.url}
                    alt=""
                    width={112}
                    height={112}
                    sizes="56px"
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{initials(v.organization || '?')}</span>
                ),
                'xp-node rounded-[12px]',
              )}
              <div className="xp-main">
                <InlineArea
                  key={`title_${lang}`}
                  label={label(education ? 'Jenjang / jurusan' : 'Peran')}
                  {...register(`title_${lang}`)}
                  measure={v[`title_${lang}`] ?? ''}
                  placeholder={t(education ? 'Jenjang / jurusan' : 'Peran')}
                  invalid={Boolean(err(`title_${lang}`))}
                  className="text-h3 font-semibold"
                />
                <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
                  {lang === 'en' ? (
                    <InlineInput
                      key="organization_en"
                      label={t('Instansi dalam bahasa Inggris (opsional)')}
                      {...register('organization_en')}
                      placeholder={v.organization || ''}
                      size={Math.max(4, (orgName || '').length + 1)}
                      invalid={Boolean(err('organization_en'))}
                    />
                  ) : (
                    <InlineInput
                      key="organization"
                      label={t(education ? 'Sekolah / kampus' : 'Instansi')}
                      {...register('organization')}
                      placeholder={t(education ? 'Sekolah / kampus' : 'Instansi')}
                      size={Math.max(4, (v.organization || '').length + 1)}
                      invalid={Boolean(err('organization'))}
                    />
                  )}
                  {education ? null : (
                    <>
                      <span aria-hidden="true">·</span>
                      <select
                        aria-label={t('Jenis pekerjaan (opsional)')}
                        {...register('employmentType')}
                        className="admin-inline cursor-pointer text-muted"
                      >
                        <option value="">{t('Tidak ditampilkan')}</option>
                        {Object.entries(employmentTypeLabel).map(([value, text]) => (
                          <option key={value} value={value}>
                            {t(text)}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-muted tabular-nums">
                  <input
                    type="month"
                    aria-label={t('Mulai')}
                    {...register('startMonth')}
                    className={cn('admin-inline', err('startMonth') && 'admin-inline-bad')}
                  />
                  <span aria-hidden="true">-</span>
                  {v.endMonth ? (
                    <>
                      <input
                        type="month"
                        aria-label={t('Selesai')}
                        {...register('endMonth')}
                        className={cn('admin-inline', err('endMonth') && 'admin-inline-bad')}
                      />
                      <button
                        type="button"
                        aria-label={t('Masih berlangsung')}
                        title={t('Masih berlangsung')}
                        onClick={() => set('endMonth', '')}
                        className="inline-flex size-7 items-center justify-center rounded-md hover:bg-surface-2"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title={t('Tekan untuk mengisi bulan selesai')}
                      onClick={() => set('endMonth', thisMonth())}
                      className="inline-flex min-h-7 items-center rounded-md px-1.5 underline decoration-dotted underline-offset-4 hover:text-text"
                    >
                      {presentLabel[lang]}
                    </button>
                  )}
                  {education ? null : (
                    <>
                      <span aria-hidden="true">·</span>
                      <InlineInput
                        label={t('Lokasi (opsional)')}
                        {...register('location')}
                        placeholder={t('Lokasi (opsional)')}
                        size={Math.max(8, (v.location || '').length + 1)}
                        invalid={Boolean(err('location'))}
                      />
                    </>
                  )}
                </p>
                <InlineArea
                  key={`description_${lang}`}
                  label={label(education ? 'Grade / GPA' : 'Uraian')}
                  {...register(`description_${lang}`)}
                  measure={v[`description_${lang}`] ?? ''}
                  placeholder={t(education ? 'Grade / GPA' : 'Uraian')}
                  invalid={Boolean(err(`description_${lang}`))}
                  className="xp-desc mt-3 text-muted"
                />
              </div>
              <div className="xp-side">
                {education ? (
                  <span className="xp-year block">
                    <span className="font-display text-[2.75rem] leading-none font-bold">
                      {(v.startMonth || '').slice(0, 4) || '----'}
                    </span>
                  </span>
                ) : (
                  assetButton(
                    'photo',
                    assets.photo ? (
                      <span className="xp-frame">
                        <Image
                          placeholder={SHIMMER_PLACEHOLDER}
                          src={assets.photo.url}
                          alt=""
                          width={assets.photo.width ?? 800}
                          height={assets.photo.height ?? 600}
                          sizes="320px"
                          className="xp-photo"
                        />
                      </span>
                    ) : (
                      <span className="xp-year block">
                        <span className="font-display text-[2.75rem] leading-none font-bold">
                          {(v.startMonth || '').slice(0, 4) || '----'}
                        </span>
                      </span>
                    ),
                    'block rounded-[12px] text-left',
                  )
                )}
              </div>
            </li>
          </ol>
        </LiveStage>
        <LiveErrors messages={messages} />
        <SaveBar
          pending={pending}
          label={experienceId ? 'Simpan' : education ? 'Tambah pendidikan' : 'Tambah pengalaman'}
        />
      </form>
      {slot && experienceId ? (
        <AssetEditDialog
          open
          onClose={() => setSlot(null)}
          onDone={() => {
            setSlot(null)
            router.refresh()
          }}
          title={
            slot === 'photo'
              ? 'Foto kegiatan'
              : education
                ? 'Logo sekolah / kampus'
                : 'Logo instansi'
          }
          description={
            slot === 'photo'
              ? 'Tampil di sisi seberang teks pada timeline. Rasio 4:3 disarankan; maks. 5 MB.'
              : education
                ? 'Tampil bulat di kartu pendidikan; logo pendidikan terbaru juga dipakai chip kampus di kartu foto. Logo persegi paling rapi; maks. 2 MB.'
                : 'Tampil bulat di garis timeline. PNG berlatar transparan atau logo persegi paling rapi; maks. 2 MB.'
          }
          target={slot === 'logo' ? 'experience-logo' : 'experience-photo'}
          targetId={experienceId}
          asset={assets[slot]}
          configured={configured}
        />
      ) : null}
    </>
  )
}
