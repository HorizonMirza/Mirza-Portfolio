'use client'

import { Pencil, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type CSSProperties, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import { SiteFrame } from '@/components/admin/site-frame'
import { PhotoTilt } from '@/features/profile/components/photo-tilt'
import { imageRatio } from '../browser-address'
import { type ChipData, TechChipsList } from './public/tech-chips-list'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { deleteProject, moveProject, saveProjectTexts } from '../actions'

type Field = 'title' | 'role' | 'summary'

export type ProjectListRow = {
  id: string
  // judul, peran, dan ringkasan per bahasa (diketik langsung di daftar)
  texts: Record<Lang, Record<Field, string>>
  status: 'DRAFT' | 'PUBLISHED'
  address: string
  cover: { url: string; width: number | null; height: number | null } | null
  // chip teknologi seperti di situs
  chips: ChipData[]
}

// Daftar project persis seperti halaman Project situs (DESIGN.md bagian 138 dan 164): judul halaman,
// baris zig-zag dengan sampul di bingkai browser miring, peran, judul huruf besar, ringkasan, chip
// teknologi, dan nomor besar, dirender dengan markup dan kelas situs di dalam bingkai layar yang
// diperkecil (SiteFrame). Peran, judul, dan ringkasan diketik langsung di tempatnya (bergaris
// putus-putus) dan disimpan lewat Simpan, dengan pilihan ID/EN di atasnya. Sampul dan ikon pensil
// membuka halaman ubah project; urutan dan hapus muncul saat baris disorot atau difokus.
export function ProjectListLive({
  rows,
  copy,
}: {
  rows: ProjectListRow[]
  copy: Record<Lang, { title: string; stack: string }>
}) {
  const t = useAdminT()
  const router = useRouter()
  const [lang, setLang] = useEditLang()
  const [pending, startTransition] = useTransition()
  // perubahan yang belum disimpan: id → "judul_id" → teks
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({})
  const label = (text: string) => `${t(text)} (${t(LANG_NAME[lang])})`

  const shown = (row: ProjectListRow, field: Field) =>
    edits[row.id]?.[`${field}_${lang}`] ?? row.texts[lang][field]

  function edit(row: ProjectListRow, field: Field, value: string) {
    const key = `${field}_${lang}`
    setEdits((all) => {
      const mine = { ...all[row.id], [key]: value }
      if (value === row.texts[lang][field]) delete mine[key]
      const next = { ...all, [row.id]: mine }
      if (Object.keys(mine).length === 0) delete next[row.id]
      return next
    })
  }

  const dirtyLang: Partial<Record<Lang, boolean>> = {
    id: Object.values(edits).some((e) => Object.keys(e).some((k) => k.endsWith('_id'))),
    en: Object.values(edits).some((e) => Object.keys(e).some((k) => k.endsWith('_en'))),
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    const items = Object.entries(edits).map(([id, e]) => ({ id, ...e }))
    if (items.length === 0) {
      toast.success(t('Project disimpan.'))
      return
    }
    // judul dan ringkasan wajib diisi
    const empty = items.some((i) =>
      Object.entries(i).some(([k, v]) => /^(title|summary)_/.test(k) && !String(v).trim()),
    )
    if (empty) {
      toast.error(t('Judul dan ringkasan wajib diisi.'))
      return
    }
    startTransition(async () => {
      const result = await saveProjectTexts(items)
      if (!result.ok) {
        toast.error(t(result.message))
        return
      }
      toast.success(t(result.message))
      setEdits({})
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <SiteFrame autoHeight>
        <div className="admin-tight mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6 lg:px-8">
          {/* judul halaman di tengah, sama dengan situs */}
          <header className="pt-12 pb-10 text-center md:pt-20">
            <h1 className="mx-auto mt-3 max-w-3xl text-h1 font-bold">{copy[lang].title}</h1>
          </header>
          <Link
            href="/admin/projects/new"
            className="mb-12 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('Project baru')}
          </Link>
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-muted">
              {t('Belum ada project.')}
            </p>
          ) : (
            <ol className="flex flex-col gap-16 md:gap-24">
              {rows.map((row, i) => {
                const flip = i % 2 === 1
                const number = String(i + 1).padStart(2, '0')
                const title = shown(row, 'title')
                return (
                  <li key={row.id} lang={lang}>
                    <article className="pj-zz group relative grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-12">
                      <div
                        className={cn(
                          'pj-zz-img relative z-10',
                          flip ? 'pj-zz-from-right md:order-2' : 'pj-zz-from-left',
                        )}
                      >
                        {/* sampul membuka halaman ubah project */}
                        <Link href={`/admin/projects/${row.id}`} className="block">
                          <PhotoTilt className="pj-tilt" maxTilt={8} sound={false}>
                            <div className="pj-tilt-in" data-tilt-target="">
                              <div className="pj-browser">
                                <div className="pj-browser-bar" aria-hidden="true">
                                  <span className="pj-browser-dots">
                                    <i />
                                    <i />
                                    <i />
                                  </span>
                                  <span className="pj-browser-url">{row.address}</span>
                                </div>
                                <div
                                  className="relative overflow-hidden bg-surface-2"
                                  style={{ aspectRatio: imageRatio(row.cover) }}
                                >
                                  {row.cover ? (
                                    <Image
                                      placeholder={SHIMMER_PLACEHOLDER}
                                      src={row.cover.url}
                                      alt=""
                                      fill
                                      sizes="(min-width: 768px) 560px, 100vw"
                                      className="object-contain"
                                    />
                                  ) : (
                                    <div className="project-cover-fallback absolute inset-0 flex items-end p-5">
                                      <span className="font-mono text-display leading-none font-bold text-border-strong/40">
                                        {number}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className="pj-glare" data-tilt-glare="" />
                              </div>
                            </div>
                          </PhotoTilt>
                          <span className="sr-only">{t('Ubah {item}', { item: title })}</span>
                        </Link>
                      </div>
                      <div className="pj-zz-text relative grid grid-cols-[minmax(0,1fr)_auto] items-center">
                        <div className="pj-title-box flex flex-col gap-3 pe-4 md:px-6">
                          <p className="pj-role">
                            <InlineInput
                              label={label('Peran saya (opsional)')}
                              value={shown(row, 'role')}
                              placeholder={t('Peran saya (opsional)')}
                              maxLength={80}
                              size={Math.max(12, shown(row, 'role').length + 1)}
                              onChange={(event) => edit(row, 'role', event.target.value)}
                            />
                          </p>
                          <h2
                            className="pj-title-fit pj-row-title font-semibold"
                            style={{ '--chars': title.length } as CSSProperties}
                          >
                            <InlineArea
                              label={label('Judul')}
                              value={title}
                              measure={title}
                              maxLength={120}
                              placeholder={t('Judul')}
                              onChange={(event) => edit(row, 'title', event.target.value)}
                            />
                          </h2>
                          <p className="pj-summary text-muted">
                            <InlineArea
                              label={label('Ringkasan')}
                              value={shown(row, 'summary')}
                              measure={shown(row, 'summary')}
                              maxLength={240}
                              placeholder={t('Ringkasan')}
                              onChange={(event) => edit(row, 'summary', event.target.value)}
                            />
                          </p>
                          <TechChipsList chips={row.chips} label={copy[lang].stack} />
                          <div className="relative z-10 flex flex-wrap items-center gap-2">
                            {row.status === 'DRAFT' ? (
                              <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs font-semibold text-muted">
                                {t('Draf')}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                              <Link
                                href={`/admin/projects/${row.id}`}
                                aria-label={t('Ubah {item}', { item: title })}
                                className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Link>
                              <ReorderButtons
                                itemLabel={title}
                                isFirst={i === 0}
                                isLast={i === rows.length - 1}
                                onMove={(dir) => moveProject(row.id, dir)}
                              />
                              <ConfirmDelete
                                title="Hapus Project"
                                iconOnly
                                itemLabel={title}
                                onConfirm={() => deleteProject(row.id)}
                              />
                            </span>
                          </div>
                        </div>
                        <span aria-hidden="true" className="pj-bignum">
                          {number}
                        </span>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </SiteFrame>
      {/* bahasa isi tepat di atas Simpan, seperti halaman lain */}
      <LangRow lang={lang} onChange={setLang} dirty={dirtyLang} />
      <SaveBar pending={pending} />
    </form>
  )
}
