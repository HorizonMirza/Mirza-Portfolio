'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

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
  title_id: string
  start: string
  period: string
  status: 'DRAFT' | 'PUBLISHED'
}

const helper = adminColumnHelper<ExperienceRow>()

function RowActions({ row, kind }: { row: ExperienceRow; kind: ExperienceKind }) {
  const label = `${row.title_id} di ${row.organization}`
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${kindBasePath[kind]}/${row.id}`} aria-label={`Ubah ${label}`}>
          <Pencil aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Ubah</span>
        </Link>
      </Button>
      <ConfirmDelete itemLabel={label} onConfirm={() => deleteExperience(row.id)} />
    </div>
  )
}

// Pendidikan (About → Pendidikan) tanpa kolom jenis; judul kolom menyesuaikan.
function columnsFor(kind: ExperienceKind) {
  const education = kind === 'education'
  return helper.columns([
    helper.accessor('title_id', {
      header: education ? 'Jenjang / jurusan' : 'Peran',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    helper.accessor('organization', { header: education ? 'Sekolah / kampus' : 'Instansi' }),
    ...(education
      ? []
      : [
          helper.accessor('type', {
            header: 'Jenis',
            cell: (info) => experienceTypeLabel[info.getValue()],
          }),
        ]),
    // Urut berdasarkan tanggal mulai (YYYY-MM), tampil sebagai periode.
    helper.accessor('start', {
      header: 'Periode',
      cell: (info) => (
        <span className="whitespace-nowrap tabular-nums">{info.row.original.period}</span>
      ),
    }),
    helper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    helper.display({
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
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
  const columns = useMemo(() => columnsFor(kind), [kind])
  const education = kind === 'education'
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel={education ? 'Cari pendidikan' : 'Cari pengalaman'}
      emptyText={
        education ? 'Belum ada pendidikan yang cocok.' : 'Belum ada pengalaman yang cocok.'
      }
      renderCard={(row) => (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{row.title_id}</p>
              <p className="mt-1 text-sm text-muted">
                {education
                  ? row.organization
                  : `${row.organization} · ${experienceTypeLabel[row.type]}`}
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
