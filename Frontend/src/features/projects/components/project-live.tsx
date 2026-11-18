'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ExternalLink, ImagePlus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useForm, useWatch } from 'react-hook-form'

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
import { RemoveAssetButton } from '@/features/assets/components/remove-asset-button'
import { useAssetPicker } from '@/features/assets/components/use-asset-picker'
import { uploadAsset } from '@/features/assets/upload-client'
import type { AssetView } from '@backend/features/assets/asset-view'
import { CLIENT_ICON_PATHS } from '@/features/skills/client-icon-paths'
import type { SkillOptionGroup } from '@backend/features/skills/queries'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'
import { slugify } from '@backend/lib/validation'

import { imageRatio } from '../browser-address'

import { saveProject } from '@backend/features/projects/actions'
import {
  type ProjectInput,
  projectSchema,
  type ProjectValues,
} from '@backend/features/projects/schema'

// gambar yang dipilih untuk project baru dan baru diunggah setelah project tersimpan
type PendingImage = { blob: Blob; name: string; preview: string }
// satu foto di galeri: gambar tersimpan (assetId) atau gambar baru yang belum diunggah
type StageItem = {
  key: string
  url: string
  width: number | null
  height: number | null
  assetId?: string
}

type ButtonTexts = Record<Lang, { demo: string; repo: string; back: string; stack: string }>

// Admin → Projects, satu project (DESIGN.md bagian 138): halaman detail project seperti di situs
// (tautan kembali, peran, judul, tombol aplikasi dan GitHub, galeri di bingkai browser), diketik
// langsung. Tombol ditekan untuk ditampilkan atau disembunyikan, URL-nya diketik di bawah tombol.
// Galeri seperti di situs (foto besar + deretan gambar kecil, foto pertama = sampul): foto sampul
// ditekan untuk diganti, tombol + menambah gambar, tong sampah menghapus foto yang sedang tampil.
// Ringkasan dan teknologi (tampil di daftar project) di bawahnya. Status, kategori, dan tahun tidak
// diubah di sini (revisi pemilik 2026-11-16); bahasa ikut pilihan bahasa di bilah atas admin.
export function ProjectLive({
  projectId,
  defaultValues,
  skillGroups,
  cover,
  images,
  configured,
  texts,
  host,
}: {
  projectId: string | null
  defaultValues: ProjectInput
  skillGroups: SkillOptionGroup[]
  cover: AssetView | null
  // gambar galeri (di luar sampul), sesuai urutan unggah
  images: AssetView[]
  configured: boolean
  texts: ButtonTexts
  // host situs untuk alamat di bingkai browser (siteHost() dari server)
  host: string
}) {
  const t = useAdminT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // sampul ditekan: langsung membuka pemilih berkas, lalu pemotong gambar (DESIGN.md bagian 148)
  const picker = useAssetPicker({ configured, onDone: () => router.refresh() })
  const [lang, setLang] = useEditLang()
  // foto yang sedang tampil di galeri (0 = sampul bila ada)
  const [active, setActive] = useState(0)
  // project baru: gambar yang sudah dipilih dan dipotong, diunggah setelah project tersimpan (butuh id)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const pendingRef = useRef(pendingImages)
  useEffect(() => {
    pendingRef.current = pendingImages
  }, [pendingImages])
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])
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
        else if (result.data) {
          // gambar yang dipilih sebelum project tersimpan: pertama = sampul, sisanya galeri
          for (const [i, img] of pendingImages.entries()) {
            const sent = await uploadAsset(
              i === 0 ? 'project-cover' : 'project-gallery',
              result.data.id,
              img.blob,
              img.name,
            )
            if (!sent.ok) {
              toast.error(t(sent.message))
              break
            }
          }
          router.replace(`/admin/projects/${result.data.id}`)
        }
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
  // foto pertama = sampul (seperti di situs), disusul gambar galeri; project baru memakai gambar
  // yang baru dipilih (belum diunggah)
  const items: StageItem[] = projectId
    ? [...(cover ? [cover] : []), ...images].map((a) => ({
        key: a.id,
        url: a.url,
        width: a.width,
        height: a.height,
        assetId: a.id,
      }))
    : pendingImages.map((p) => ({ key: p.preview, url: p.preview, width: null, height: null }))
  const hasCover = items.length > 0 && (projectId ? Boolean(cover) : true)
  const current = Math.min(active, Math.max(0, items.length - 1))
  const shown = items[current] ?? null
  const shownIsCover = hasCover && current === 0
  const galleryNumber = (i: number) => i - (hasCover ? 1 : 0) + 1
  const slotLabel = (i: number) =>
    hasCover && i === 0 ? t('Sampul') : t('gambar galeri {n}', { n: galleryNumber(i) })

  // memilih gambar: project tersimpan langsung diunggah, project baru ditahan sampai tersimpan
  function pickImage(target: 'project-cover' | 'project-gallery', replaceCover = false) {
    if (projectId) {
      picker.pick(target, projectId)
      return
    }
    picker.pick(target, undefined, (blob, name) => {
      const preview = URL.createObjectURL(blob)
      setPendingImages((list) => {
        if (replaceCover && list.length > 0) {
          URL.revokeObjectURL(list[0]!.preview)
          return [{ blob, name, preview }, ...list.slice(1)]
        }
        return [...list, { blob, name, preview }]
      })
    })
  }
  function removePending(index: number) {
    setPendingImages((list) => {
      URL.revokeObjectURL(list[index]!.preview)
      return list.filter((_, i) => i !== index)
    })
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <LiveStage className="relative bg-bg px-4 pt-6 pb-10 text-text sm:px-10">
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
                    wrap
                    key={`role_${lang}`}
                    label={label('Peran Saya (Opsional)')}
                    {...register(`role_${lang}`)}
                    placeholder={t('Peran Saya (Opsional)')}
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
                {/* tombol detail: ditekan untuk tampil/sembunyi, URL diketik di bawahnya; dua kolom sama
                    lebar agar tombol dan kolom URL lurus */}
                <div
                  role="group"
                  aria-label={t('Tombol di Halaman Detail')}
                  className="admin-tight mx-auto mt-4 grid w-full max-w-136 gap-x-4 gap-y-4 sm:grid-cols-2 md:mt-6"
                >
                  {(
                    [
                      ['demo', 'showDemo', 'demoUrl', 'URL Demo (Opsional)'],
                      ['repo', 'showRepo', 'repoUrl', 'URL Repo (Opsional)'],
                    ] as const
                  ).map(([key, show, url, urlLabel]) => (
                    <div key={key} className="flex min-w-0 flex-col gap-2">
                      <button
                        type="button"
                        aria-pressed={Boolean(v[show])}
                        onClick={() => setValue(show, !v[show], opts)}
                        className={cn(
                          'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold',
                          v[show]
                            ? 'border-border-strong bg-surface text-text'
                            : 'border-dashed border-border text-muted line-through',
                        )}
                      >
                        {key === 'demo' ? (
                          <ExternalLink className="size-4" aria-hidden="true" />
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-4"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d={CLIENT_ICON_PATHS.github} />
                          </svg>
                        )}
                        {tx[key]}
                      </button>
                      <InlineInput
                        wrap
                        label={t(urlLabel)}
                        type="url"
                        inputMode="url"
                        {...register(url)}
                        placeholder="https://…"
                        invalid={Boolean(err(url))}
                        className="w-full text-center font-mono text-xs leading-6 text-muted"
                      />
                    </div>
                  ))}
                </div>
              </header>
            </div>

            {/* galeri seperti di situs: bingkai jendela browser, foto besar, deretan gambar kecil */}
            <div>
              <div className="pj-browser">
                <div className="pj-browser-bar">
                  <span className="pj-browser-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  {/* alamat halaman project: bagian akhirnya (slug) diketik di sini seperti kolom alamat */}
                  {/* di bilah sempit slug turun ke baris berikutnya utuh, alamat tidak dipatah */}
                  <span className="pj-browser-url admin-tight flex flex-wrap items-center">
                    <span aria-hidden="true" className="whitespace-nowrap">
                      {host}/projects/
                    </span>
                    <InlineInput
                      wrap
                      label={t('Slug')}
                      {...register('slug')}
                      placeholder="nama-project"
                      size={Math.max(12, (v.slug || '').length + 1)}
                      invalid={Boolean(err('slug'))}
                      className="text-text"
                    />
                  </span>
                </div>
                <div className="group/cover relative">
                  {shown ? (
                    <div className="pd-stage" style={{ aspectRatio: imageRatio(items[0] ?? null) }}>
                      {shown.assetId ? (
                        <Image
                          key={shown.key}
                          placeholder={SHIMMER_PLACEHOLDER}
                          src={shown.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 1100px, 90vw"
                          className="object-contain"
                        />
                      ) : (
                        // gambar yang baru dipilih (project baru): alamat sementara dari berkas
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={shown.key}
                          src={shown.url}
                          alt=""
                          className="absolute inset-0 size-full object-contain"
                        />
                      )}
                      {/* garis putus-putus 6 px di dalam tepi foto, sama untuk sampul dan gambar galeri;
                          sampul ditekan untuk diganti (membuka pemilih berkas) */}
                      {shownIsCover ? (
                        <button
                          type="button"
                          onClick={() => pickImage('project-cover', true)}
                          className="admin-editable absolute inset-1.5 cursor-pointer rounded-none [--editable-offset:0px] focus-visible:outline-2 focus-visible:outline-current"
                        >
                          <span className="sr-only">{t('Ganti Sampul')}</span>
                        </button>
                      ) : (
                        <div
                          aria-hidden="true"
                          className="admin-editable pointer-events-none absolute inset-1.5 rounded-none [--editable-offset:0px]"
                        />
                      )}
                    </div>
                  ) : picker.busy ? (
                    <span
                      aria-hidden="true"
                      className="skeleton block aspect-video w-full rounded-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => pickImage('project-cover')}
                      className="admin-editable relative block aspect-video w-full cursor-pointer bg-surface-2 outline-offset-[-6px] [--editable-offset:-6px] focus-visible:outline-2 focus-visible:outline-current"
                    >
                      <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted">
                        <ImagePlus className="size-6" aria-hidden="true" />
                        {t('Sampul')}
                      </span>
                    </button>
                  )}
                  {shown ? (
                    <span className="absolute top-3 right-3 rounded-md bg-bg/80">
                      {shown.assetId ? (
                        <RemoveAssetButton
                          assetId={shown.assetId}
                          label={slotLabel(current)}
                          onDone={() => router.refresh()}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => removePending(current)}
                          aria-label={t('Hapus {item}', { item: slotLabel(current) })}
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="pd-thumbs">
                {items.map((img, i) => (
                  <button
                    key={img.key}
                    type="button"
                    aria-label={slotLabel(i)}
                    aria-pressed={i === current}
                    onClick={() => setActive(i)}
                  >
                    {img.assetId ? (
                      <Image
                        placeholder={SHIMMER_PLACEHOLDER}
                        src={img.url}
                        alt=""
                        fill
                        sizes="76px"
                        className="object-cover object-top"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.url}
                        alt=""
                        className="absolute inset-0 size-full object-cover object-top"
                      />
                    )}
                  </button>
                ))}
                {/* gambar yang sedang diunggah */}
                {picker.busy ? (
                  <span
                    aria-hidden="true"
                    className="skeleton shrink-0 rounded-lg"
                    style={{ flex: '0 1 4.75rem', minWidth: '2.75rem', aspectRatio: '16 / 10' }}
                  />
                ) : null}
                {/* + menambah gambar; tanpa sampul, gambar pertama menjadi sampul seperti di situs */}
                <button
                  type="button"
                  className="pd-add admin-editable"
                  onClick={() => pickImage(hasCover ? 'project-gallery' : 'project-cover')}
                >
                  <Plus className="size-5" aria-hidden="true" />
                  <span className="sr-only">{hasCover ? t('Tambah ke Galeri') : t('Sampul')}</span>
                </button>
              </div>
              {items.length > 1 ? (
                <p className="mt-3 text-center font-display text-base font-medium tracking-wide text-muted">
                  {current + 1} / {items.length}
                </p>
              ) : null}
            </div>

            {/* Ringkasan tampil di daftar project dan diketik di sana; di sini hanya untuk project
                baru karena wajib diisi sebelum bisa dibuat. */}
            {projectId ? null : (
              <InlineArea
                key={`summary_${lang}`}
                label={label('Ringkasan')}
                {...register(`summary_${lang}`)}
                measure={v[`summary_${lang}`] ?? ''}
                placeholder={t('Ringkasan')}
                invalid={Boolean(err(`summary_${lang}`))}
                className="text-sm text-muted"
              />
            )}

            {/* teknologi project: dipilih dari skill yang dimiliki, tampil seperti daftar Skill teknis */}
            <div className="pj-pick admin-tight flex flex-col" role="group" aria-label={tx.stack}>
              {skillGroups.length === 0 ? (
                <p className="text-sm text-muted">
                  {t('Belum ada skill. Tambahkan di menu Skill.')}
                </p>
              ) : (
                skillGroups.map((group) => (
                  <section
                    key={group.id}
                    className="border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <p className="text-lg font-semibold">
                      {lang === 'en' ? group.name_en : group.name}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {group.skills.map((skill) => {
                        const on = skills.includes(skill.id)
                        return (
                          <li key={skill.id}>
                            <button
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleSkill(skill.id)}
                              className={cn(
                                'inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium',
                                on
                                  ? 'border-text bg-surface ring-1 ring-text'
                                  : 'border-dashed border-border text-muted hover:text-text',
                              )}
                            >
                              {skill.logo ? (
                                // logo kecil statis (unggahan atau public/skills), tanpa optimasi next/image
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={skill.logo.src}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="size-5 object-contain"
                                  data-invert-dark={skill.logo.invertDark ? '' : undefined}
                                />
                              ) : null}
                              {skill.name}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </article>
        </LiveStage>
        <LiveErrors messages={messages} />
        {/* bahasa isi tepat di atas Simpan, seperti halaman lain */}
        <LangRow
          lang={lang}
          onChange={setLang}
          dirty={{ id: dirtyLang('id'), en: dirtyLang('en') }}
        />
        <SaveBar pending={pending} label="Simpan" />
      </form>
      {picker.element}
    </>
  )
}
