'use client'

import { Pencil, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import {
  InlineArea,
  InlineInput,
  LANG_NAME,
  type Lang,
  LangRow,
  LiveStage,
  SaveBar,
  useEditLang,
} from '@/components/admin/live-edit'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
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
  cover: string | null
}

// Daftar project seperti halaman Project situs (DESIGN.md bagian 138 dan 157): baris zig-zag dengan
// sampul di bingkai browser, peran, judul, dan ringkasan. Peran, judul, dan ringkasan diketik
// langsung di tempatnya (bergaris putus-putus) dan disimpan lewat Simpan di bawah, dengan pilihan
// ID/EN. Sampul dan ikon pensil membuka halaman ubah project; urutan (sama dengan situs) dan hapus
// muncul saat baris disorot atau difokus.
export function ProjectListLive({ rows }: { rows: ProjectListRow[] }) {
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
      <LiveStage className="bg-bg px-4 py-8 text-text sm:px-10">
        <div className="admin-tight mx-auto flex max-w-6xl flex-col gap-10">
          <Link
            href="/admin/projects/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('Project baru')}
          </Link>
          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-muted">
              {t('Belum ada project.')}
            </p>
          ) : (
            <ol className="flex flex-col gap-12">
              {rows.map((row, i) => {
                const flip = i % 2 === 1
                const number = String(i + 1).padStart(2, '0')
                const title = shown(row, 'title')
                return (
                  <li
                    key={row.id}
                    lang={lang}
                    className="group relative grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-12"
                  >
                    {/* sampul membuka halaman ubah project */}
                    <Link
                      href={`/admin/projects/${row.id}`}
                      className={cn('pj-browser block', flip && 'md:order-2')}
                    >
                      <div className="pj-browser-bar" aria-hidden="true">
                        <span className="pj-browser-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                        <span className="pj-browser-url">{row.address}</span>
                      </div>
                      <div className="relative aspect-video bg-surface-2">
                        {row.cover ? (
                          <Image
                            placeholder={SHIMMER_PLACEHOLDER}
                            src={row.cover}
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
                      <span className="sr-only">{t('Ubah {item}', { item: title })}</span>
                    </Link>
                    <div className="flex flex-col gap-3 md:px-6">
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
                      <h2 className="text-h3 font-semibold">
                        <InlineArea
                          label={label('Judul')}
                          value={title}
                          measure={title}
                          maxLength={120}
                          placeholder={t('Judul')}
                          onChange={(event) => edit(row, 'title', event.target.value)}
                        />
                      </h2>
                      <InlineArea
                        label={label('Ringkasan')}
                        value={shown(row, 'summary')}
                        measure={shown(row, 'summary')}
                        maxLength={240}
                        placeholder={t('Ringkasan')}
                        onChange={(event) => edit(row, 'summary', event.target.value)}
                        className="max-w-[40ch] text-muted"
                      />
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
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </LiveStage>
      {/* bahasa isi tepat di atas Simpan, seperti halaman lain */}
      <LangRow lang={lang} onChange={setLang} dirty={dirtyLang} />
      <SaveBar pending={pending} />
    </form>
  )
}
