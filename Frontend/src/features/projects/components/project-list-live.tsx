'use client'

import { Plus, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { LiveStage } from '@/components/admin/live-edit'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'
import { cn } from '@/lib/utils'

import { deleteProject, moveProject } from '../actions'

export type ProjectListRow = {
  id: string
  // teks dalam bahasa admin (Inggris bila ada)
  title: string
  role: string
  summary: string
  status: 'DRAFT' | 'PUBLISHED'
  featured: boolean
  address: string
  cover: string | null
}

// Daftar project seperti halaman Project situs (DESIGN.md bagian 138): baris zig-zag dengan sampul di
// bingkai browser, peran, judul, dan ringkasan. Baris ditekan untuk dibuka dan diubah; urutan (sama
// dengan situs) dan hapus muncul saat baris disorot atau difokus. Draf dan unggulan ditandai.
export function ProjectListLive({ rows }: { rows: ProjectListRow[] }) {
  const t = useAdminT()
  return (
    <LiveStage className="bg-bg px-4 py-8 text-text sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
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
              return (
                <li
                  key={row.id}
                  className="group relative grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-12"
                >
                  <div className={cn('pj-browser', flip && 'md:order-2')}>
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
                  </div>
                  <div className="flex flex-col gap-3 md:px-6">
                    {row.role ? <p className="pj-role">{row.role}</p> : null}
                    <h2 className="text-h3 font-semibold">
                      <Link
                        href={`/admin/projects/${row.id}`}
                        className="rounded-md outline-offset-4 after:absolute after:inset-0 after:content-[''] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-current"
                      >
                        {row.title}
                        {/* nama tautan = teks yang terlihat + keterangan (axe label-content-name-mismatch) */}
                        <span className="sr-only">{t(', ubah')}</span>
                      </Link>
                    </h2>
                    <p className="max-w-[40ch] text-muted">{row.summary}</p>
                    <div className="relative z-10 flex flex-wrap items-center gap-2">
                      {row.status === 'DRAFT' ? (
                        <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs font-semibold text-muted">
                          {t('Draf')}
                        </span>
                      ) : null}
                      {row.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-semibold">
                          <Star className="size-3" aria-hidden="true" />
                          {t('Unggulan')}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                        <ReorderButtons
                          itemLabel={row.title}
                          isFirst={i === 0}
                          isLast={i === rows.length - 1}
                          onMove={(dir) => moveProject(row.id, dir)}
                        />
                        <ConfirmDelete
                          itemLabel={row.title}
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
  )
}
