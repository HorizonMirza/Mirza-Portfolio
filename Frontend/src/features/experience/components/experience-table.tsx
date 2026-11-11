'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useAdminT } from '@/components/admin/admin-lang'
import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { adminColumnHelper, DataTable } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { deleteExperience } from '../actions'
import { type ExperienceKind, experienceTypeLabel, kindBasePath } from '../schema'

export type ExperienceRow = {
  id: string
  type: keyof typeof experienceTypeLabel
  organization: string
  // judul dalam bahasa admin (Inggris bila ada)
  title: string
  start: string
  period: string
  status: 'DRAFT' | 'PUBLISHED'
}

const helper = adminColumnHelper<ExperienceRow>()

type T = ReturnType<typeof useAdminT>

function RowActions({ row, kind }: { row: ExperienceRow; kind: ExperienceKind }) {
  const t = useAdminT()
  const label = t('{title} di {organization}', { title: row.title, organization: row.organization })
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link
          href={`${kindBasePath[kind]}/${row.id}`}
          aria-label={t('Ubah {item}', { item: label })}
        >
          <Pencil aria-hidden="true" />
          <span className="sr-only md:not-sr-only">{t('Ubah')}</span>
        </Link>
      </Button>
      <ConfirmDelete itemLabel={label} onConfirm={() => deleteExperience(row.id)} />
    </div>
  )
}

// Pendidikan (About → Pendidikan) tanpa kolom jenis; judul kolom menyesuaikan.
function columnsFor(kind: ExperienceKind, t: T) {
  const education = kind === 'education'
  return helper.columns([
    helper.accessor('title', {
      header: education ? t('Jenjang / jurusan') : t('Peran'),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    helper.accessor('organization', {
      header: education ? t('Sekolah / kampus') : t('Instansi'),
    }),
    ...(education
      ? []
      : [
          helper.accessor('type', {
            header: t('Jenis'),
            cell: (info) => t(experienceTypeLabel[info.getValue()]),
          }),
        ]),
    // Urut berdasarkan tanggal mulai (YYYY-MM), tampil sebagai periode.
    helper.accessor('start', {
      header: t('Periode'),
      cell: (info) => (
        <span className="whitespace-nowrap tabular-nums">{info.row.original.period}</span>
      ),
    }),
    helper.accessor('status', {
      header: t('Status'),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">{t('Aksi')}</span>,
      cell: (info) => <RowActions row={info.row.original} kind={kind} />,
    }),
  ])
}

export function ExperienceTable({
  rows,
  kind = 'experience',
}: {
  rows: ExperienceRow[]
  kind?: ExperienceKind
}) {
  const t = useAdminT()
  const columns = useMemo(() => columnsFor(kind, t), [kind, t])
  const education = kind === 'education'
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel={education ? t('Cari pendidikan') : t('Cari pengalaman')}
      emptyText={
        education ? t('Belum ada pendidikan yang cocok.') : t('Belum ada pengalaman yang cocok.')
      }
      renderCard={(row) => (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{row.title}</p>
              <p className="mt-1 text-sm text-muted">
                {education
                  ? row.organization
                  : `${row.organization} · ${t(experienceTypeLabel[row.type])}`}
              </p>
              <p className="mt-1 text-sm text-muted tabular-nums">{row.period}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <RowActions row={row} kind={kind} />
        </Card>
      )}
    />
  )
}
