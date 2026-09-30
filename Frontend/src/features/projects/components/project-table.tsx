'use client'

import { Pencil, Star } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { adminColumnHelper, DataTable } from '@/components/admin/data-table'
import { ReorderButtons } from '@/components/admin/reorder-buttons'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'

import { deleteProject, moveProject } from '../actions'
import { projectCategoryLabel } from '../schema'

type Row = {
  id: string
  slug: string
  title_id: string
  status: 'DRAFT' | 'PUBLISHED'
  category: keyof typeof projectCategoryLabel
  year: number
  featured: boolean
  updatedAt: string
  position: number
}

const helper = adminColumnHelper<Row>()

function RowActions({ row, total }: { row: Row; total: number }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ReorderButtons
        itemLabel={row.title_id}
        isFirst={row.position === 0}
        isLast={row.position === total - 1}
        onMove={(dir) => moveProject(row.id, dir)}
      />
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/projects/${row.id}`} aria-label={`Ubah ${row.title_id}`}>
          <Pencil aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Ubah</span>
        </Link>
      </Button>
      <ConfirmDelete itemLabel={row.title_id} onConfirm={() => deleteProject(row.id)} />
    </div>
  )
}

export function ProjectTable({ rows }: { rows: Omit<Row, 'position'>[] }) {
  const data = useMemo(() => rows.map((r, position) => ({ ...r, position })), [rows])
  const total = data.length
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('position', {
          header: 'No',
          cell: (info) => (
            <span className="font-mono text-muted tabular-nums">{info.getValue() + 1}</span>
          ),
        }),
        helper.accessor('title_id', {
          header: 'Judul',
          cell: (info) => (
            <span className="flex items-center gap-2 font-medium">
              {info.row.original.featured ? (
                <Star className="size-4 fill-primary text-primary" aria-label="Unggulan" />
              ) : null}
              {info.getValue()}
            </span>
          ),
        }),
        helper.accessor('category', {
          header: 'Kategori',
          cell: (info) => projectCategoryLabel[info.getValue()],
        }),
        helper.accessor('year', {
          header: 'Tahun',
          cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
        }),
        helper.accessor('status', {
          header: 'Status',
          cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        helper.accessor('updatedAt', {
          header: 'Diubah',
          cell: (info) => (
            <span className="text-muted">{formatDateTime(new Date(info.getValue()))}</span>
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">Aksi</span>,
          cell: (info) => <RowActions row={info.row.original} total={total} />,
        }),
      ]),
    [total],
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel="Cari project"
      emptyText="Belum ada project yang cocok."
      renderCard={(row) => (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{row.title_id}</p>
              <p className="mt-1 text-sm text-muted">
                {projectCategoryLabel[row.category]} · {row.year}
                {row.featured ? ' · unggulan' : ''}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <RowActions row={row} total={total} />
        </Card>
      )}
    />
  )
}
