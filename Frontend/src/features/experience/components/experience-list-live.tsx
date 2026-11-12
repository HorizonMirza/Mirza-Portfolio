'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { LiveStage } from '@/components/admin/live-edit'
import { SHIMMER_PLACEHOLDER } from '@/lib/image-placeholder'

import { deleteExperience } from '../actions'
import { type ExperienceKind, initials, kindBasePath } from '../schema'

export type ExperienceListRow = {
  id: string
  organization: string
  // judul dalam bahasa admin (Inggris bila ada)
  title: string
  period: string
  status: 'DRAFT' | 'PUBLISHED'
  logo: string | null
}

// Daftar Pengalaman / Pendidikan seperti timeline situs (DESIGN.md bagian 137): tiap entri ditekan
// untuk dibuka dan diubah; tambah di atas, hapus saat entri disorot atau difokus. Draf ditandai.
export function ExperienceListLive({
  rows,
  kind,
}: {
  rows: ExperienceListRow[]
  kind: ExperienceKind
}) {
  const t = useAdminT()
  const basePath = kindBasePath[kind]
  const education = kind === 'education'
  return (
    <LiveStage className="bg-bg px-4 py-8 text-text sm:px-10">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
        <Link
          href={`${basePath}/new`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-semibold text-muted hover:text-text"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t(education ? 'Tambah pendidikan' : 'Tambah pengalaman')}
        </Link>
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-muted">
            {t(education ? 'Belum ada pendidikan.' : 'Belum ada pengalaman.')}
          </p>
        ) : (
          <ol className="xp-tl">
            {rows.map((row) => {
              const label = t('{title} di {organization}', {
                title: row.title,
                organization: row.organization,
              })
              return (
                <li key={row.id} className="group">
                  <div className="xp-node" aria-hidden="true">
                    {row.logo ? (
                      <Image
                        placeholder={SHIMMER_PLACEHOLDER}
                        src={row.logo}
                        alt=""
                        width={112}
                        height={112}
                        sizes="56px"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{initials(row.organization)}</span>
                    )}
                  </div>
                  <div className="xp-main">
                    <Link
                      href={`${basePath}/${row.id}`}
                      className="block rounded-md outline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-current"
                    >
                      <span className="block text-h3 font-semibold">{row.title}</span>
                      <span className="mt-1 block">{row.organization}</span>
                      <span className="mt-1 block text-sm text-muted tabular-nums">
                        {row.period}
                      </span>
                      {/* nama tautan = teks yang terlihat + keterangan (axe label-content-name-mismatch) */}
                      <span className="sr-only">{t(', ubah')}</span>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      {row.status === 'DRAFT' ? (
                        <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs font-semibold text-muted">
                          {t('Draf')}
                        </span>
                      ) : null}
                      <span className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                        <ConfirmDelete
                          itemLabel={label}
                          onConfirm={() => deleteExperience(row.id)}
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
