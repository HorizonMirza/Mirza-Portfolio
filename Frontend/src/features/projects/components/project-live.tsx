'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ExternalLink, GitBranch, ImagePlus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useTransition } from 'react'
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
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import type { AssetView } from '@/features/assets/components/asset-panels'
import type { SkillOptionGroup } from '@/features/skills/queries'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'
import { slugify } from '@/lib/validation'

import { browserAddress } from '../browser-address'

import { saveProject } from '../actions'
import {
  PROJECT_CATEGORIES,
  type ProjectInput,
  projectCategoryLabel,
  projectSchema,
  type ProjectValues,
} from '../schema'

type ButtonTexts = Record<Lang, { demo: string; repo: string; back: string; stack: string }>

// Admin → Projects, satu project (DESIGN.md bagian 138): halaman detail project seperti di situs
// (tautan kembali, peran, judul, tombol aplikasi dan GitHub, sampul di bingkai browser), diketik
// langsung. Tombol ditekan untuk ditampilkan atau disembunyikan, URL-nya diketik di bawah tombol.
// Sampul ditekan untuk diganti. Ringkasan dan teknologi (tampil di daftar project), deskripsi dan
// studi kasus (belum tampil), galeri, dan impor GitHub di kotak bergaris putus di bawah. Status,
// unggulan, kategori, dan tahun di baris atas.
export function ProjectLive({
  projectId,
  defaultValues,
  skillGroups,
  cover,
  configured,
  texts,
  host,
  gallery,
}: {
  projectId: string | null
  defaultValues: ProjectInput
  skillGroups: SkillOptionGroup[]
  cover: AssetView | null
  configured: boolean
  texts: ButtonTexts
  // host situs untuk alamat di bingkai browser (siteHost() dari server)
  host: string
  // galeri (komponen server) untuk project yang sudah tersimpan; di bawah tombol Simpan
  gallery?: ReactNode
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // sampul ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const [lang, setLang] = useEditLang()
  const form = useForm<ProjectInput, unknown, ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })
  const {
    register,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, dirtyFields },
  } = form
  const v = useWatch({ control })
  const otherLang: Lang = lang === 'id' ? 'en' : 'id'
  const err = (key: string) =>
    (errors as Record<string, { message?: string } | undefined>)[key]?.message
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`
  const opts = { shouldDirty: true }

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await saveProject(projectId, values)
        if (!applyResult(result, setError) || !result.ok) return
        if (projectId) form.reset(values)
        else if (result.data) router.replace(`/admin/projects/${result.data.id}`)
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

  function fillSlug() {
    if ((getValues('slug') ?? '').trim() !== '') return
    const source = getValues('title_en') || getValues('title_id')
    if (source) setValue('slug', slugify(source), { shouldValidate: true })
  }

  const pill = (on: boolean, text: string, onClick: () => void, key?: string) => (
    <button
      key={key ?? text}
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

  const skills = v.skillIds ?? []
  const toggleSkill = (id: string) =>
    setValue(
      'skillIds',
      skills.includes(id) ? skills.filter((s) => s !== id) : [...skills, id],
      opts,
    )

  const messages = Object.entries(errors).map(([key, e]) => ({
    text: `${key.replace(/_(id|en)$/, (m) => ` (${t(LANG_NAME[m.slice(1) as Lang])})`)}: ${t(
      (e as { message?: string })?.message ?? '',
    )}`,
  }))
  const dirtyLang = (l: Lang) =>
    Object.keys(dirtyFields).some((k) => k.endsWith(`_${l}`) || !/_(id|en)$/.test(k))
  const tx = texts[lang]

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="relative bg-bg px-4 pt-6 pb-10 text-text sm:px-10">
          {/* pengaturan project */}
          <div className="mb-8 flex flex-wrap items-center gap-2 pr-28">
            {pill(v.status === 'PUBLISHED', 'Terbit', () => setValue('status', 'PUBLISHED', opts))}
            {pill(v.status === 'DRAFT', 'Draf', () => setValue('status', 'DRAFT', opts))}
            {pill(Boolean(v.featured), 'Unggulan di beranda', () =>
              setValue('featured', !v.featured, opts),
            )}
            {PROJECT_CATEGORIES.map((c) =>
              pill(
                v.category === c,
                projectCategoryLabel[c],
                () => setValue('category', c, opts),
                c,
              ),
            )}
            <span className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-xs text-muted">
              {t('Tahun')}
              <input
                type="number"
                inputMode="numeric"
                aria-label={t('Tahun')}
                {...register('year', { valueAsNumber: true })}
                className={cn(
                  'admin-inline w-14 font-semibold text-text',
                  err('year') && 'admin-inline-bad',
                )}
              />
            </span>
          </div>
          <LangToggle
            lang={lang}
            onChange={setLang}
            dirty={{ id: dirtyLang('id'), en: dirtyLang('en') }}
            className="absolute top-3 right-3"
          />

          <article className="mx-auto flex max-w-6xl flex-col gap-8" lang={lang}>
            <div className="flex flex-col">
              {/* tautan kembali seperti di detail project */}
              <Link
                href="/admin/projects"
                className="inline-flex min-h-11 w-fit items-center gap-2 font-display text-base font-medium tracking-wide text-muted uppercase hover:text-text"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {tx.back}
              </Link>

              {/* kepala detail project: peran, judul, tombol di tengah */}
              <header className="pd-head mt-2 gap-1 md:mt-6">
                <span className="pj-role">
                  <InlineInput
                    key={`role_${lang}`}
                    label={label('Peran saya (opsional)')}
                    {...register(`role_${lang}`)}
                    placeholder={t('Peran saya (opsional)')}
                    size={Math.max(16, (v[`role_${lang}`] || '').length + 1)}
                    invalid={Boolean(err(`role_${lang}`))}
                    className="text-center"
                  />
                </span>
                <InlineArea
                  key={`title_${lang}`}
                  label={label('Judul')}
                  {...register(`title_${lang}`, { onBlur: fillSlug })}
                  measure={v[`title_${lang}`] ?? ''}
                  placeholder={t('Judul')}
                  invalid={Boolean(err(`title_${lang}`))}
                  className="text-center text-h2 leading-[1.15] font-bold"
                />
                <p className="flex flex-wrap items-center justify-center font-mono text-xs text-muted">
                  {host}/projects/
                  <InlineInput
                    label={t('Slug')}
                    {...register('slug')}
                    placeholder="nama-project"
                    size={Math.max(12, (v.slug || '').length + 1)}
                    invalid={Boolean(err('slug'))}
                    className="min-h-6 text-text"
                  />
                </p>

                {/* tombol detail: ditekan untuk tampil/sembunyi, URL diketik di bawahnya */}
                <div
                  role="group"
                  aria-label={t('Tombol di halaman detail')}
                  className="mt-4 flex flex-wrap justify-center gap-3 md:mt-6"
                >
                  {(
                    [
                      ['demo', 'showDemo', 'demoUrl', 'URL demo (opsional)'],
                      ['repo', 'showRepo', 'repoUrl', 'URL repo (opsional)'],
                    ] as const
                  ).map(([key, show, url, urlLabel]) => (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        aria-pressed={Boolean(v[show])}
                        onClick={() => setValue(show, !v[show], opts)}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold',
                          v[show]
                            ? 'border-border-strong bg-surface text-text'
                            : 'border-dashed border-border text-muted line-through',
                        )}
                      >
                        {key === 'demo' ? (
                          <ExternalLink className="size-4" aria-hidden="true" />
                        ) : (
                          <GitBranch className="size-4" aria-hidden="true" />
                        )}
                        {tx[key]}
                      </button>
                      <InlineInput
                        label={t(urlLabel)}
                        type="url"
                        inputMode="url"
                        {...register(url)}
                        placeholder="https://…"
                        invalid={Boolean(err(url))}
                        className="min-h-6 w-56 text-center font-mono text-xs text-ellipsis text-muted"
                      />
                    </div>
                  ))}
                </div>
              </header>
            </div>

            {/* sampul di bingkai jendela browser, seperti foto pertama galeri detail */}
            <div className="pj-browser">
              <div className="pj-browser-bar" aria-hidden="true">
                <span className="pj-browser-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="pj-browser-url">
                  {browserAddress({ slug: v.slug || '…', demoUrl: v.demoUrl || null }, host)}
                </span>
              </div>
              <div className="group/cover relative">
                <button
                  type="button"
                  disabled={!projectId}
                  onClick={() => projectId && picker.pick('project-cover', projectId)}
                  className="admin-editable relative block aspect-video w-full cursor-pointer bg-surface-2 outline-offset-[-4px] [--editable-offset:-6px] focus-visible:outline-2 focus-visible:outline-current disabled:cursor-not-allowed"
                >
                  {cover ? (
                    <Image
                      placeholder={SHIMMER_PLACEHOLDER}
                      src={cover.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 1100px, 90vw"
                      className="object-contain"
                    />
                  ) : (
                    <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted">
                      <ImagePlus className="size-6" aria-hidden="true" />
                      {projectId ? t('Sampul') : t('Simpan dulu untuk menambah sampul dan galeri')}
                    </span>
                  )}
                  {cover ? <span className="sr-only">{t('Ganti sampul')}</span> : null}
                </button>
                {cover ? (
                  <span className="absolute top-2 right-2 rounded-md bg-bg/80 opacity-0 transition-opacity group-focus-within/cover:opacity-100 group-hover/cover:opacity-100 max-md:opacity-100">
                    <RemoveAssetButton
                      assetId={cover.id}
                      label={t('Sampul')}
                      onDone={() => router.refresh()}
                    />
                  </span>
                ) : null}
              </div>
            </div>

            {/* ringkasan dan teknologi tampil di daftar project */}
            <div className="flex flex-col gap-4">
              <InlineArea
                key={`summary_${lang}`}
                label={label('Ringkasan')}
                {...register(`summary_${lang}`)}
                measure={v[`summary_${lang}`] ?? ''}
                placeholder={t('Ringkasan')}
                invalid={Boolean(err(`summary_${lang}`))}
                className="max-w-[40ch] text-muted"
              />
              <div className="flex flex-col gap-3" role="group" aria-label={tx.stack}>
                {skillGroups.length === 0 ? (
                  <p className="text-sm text-muted">
                    {t('Belum ada skill. Tambahkan di menu Skill.')}
                  </p>
                ) : (
                  skillGroups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-1.5">
                      <p className="text-xs text-muted">
                        {lang === 'en' ? group.name_en : group.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.skills.map((skill) => {
                          const on = skills.includes(skill.id)
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleSkill(skill.id)}
                              className={cn(
                                'inline-flex min-h-7 items-center rounded-full border px-2.5 font-mono text-xs',
                                on
                                  ? 'border-text bg-text font-semibold text-bg'
                                  : 'border-dashed border-border text-muted hover:text-text',
                              )}
                            >
                              {skill.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>
        </LiveStage>
        <LiveErrors messages={messages} />
        <SaveBar pending={pending} label={projectId ? 'Simpan' : 'Buat project'} />
      </form>
      {/* galeri di luar form project: tiap gambar punya form sendiri dan tersimpan langsung */}
      {gallery}
      {picker.element}
    </>
  )
}
