'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { adminColumnHelper, DataTable } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { deleteHighlight } from '../actions'

export type HighlightRow = {
  id: string
  display: string
  label_id: string
  source: string
  order: number
  status: 'DRAFT' | 'PUBLISHED'
}

const helper = adminColumnHelper<HighlightRow>()

function RowActions({ row }: { row: HighlightRow }) {
  const label = `${row.display} ${row.label_id}`
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/highlights/${row.id}`} aria-label={`Ubah ${label}`}>
          <Pencil aria-hidden="true" />
          <span className="sr-only md:not-sr-only">Ubah</span>
        </Link>
      </Button>
      <ConfirmDelete itemLabel={label} onConfirm={() => deleteHighlight(row.id)} />
    </div>
  )
}

const columns = helper.columns([
  helper.accessor('display', {
    header: 'Angka',
    cell: (info) => <span className="font-medium tabular-nums">{info.getValue()}</span>,
  }),
  helper.accessor('label_id', { header: 'Keterangan' }),
  helper.accessor('source', { header: 'Asal' }),
  helper.accessor('order', {
    header: 'Urutan',
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  helper.display({
    id: 'actions',
    header: () => <span className="sr-only">Aksi</span>,
    cell: (info) => <RowActions row={info.row.original} />,
  }),
])

export function HighlightTable({ rows }: { rows: HighlightRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel="Cari angka"
      emptyText="Belum ada angka yang cocok."
      renderCard={(row) => (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium tabular-nums">{row.display}</p>
              <p className="mt-1 text-sm text-muted">
                {row.label_id}
                {row.source ? ` · ${row.source}` : ''}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </div>
          <RowActions row={row} />
        </Card>
      )}
    />
  )
}
