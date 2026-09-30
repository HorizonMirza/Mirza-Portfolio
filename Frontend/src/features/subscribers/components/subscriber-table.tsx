'use client'

import { ConfirmDelete } from '@/components/admin/confirm-delete'
import { adminColumnHelper, DataTable } from '@/components/admin/data-table'
import { Card } from '@/components/ui/card'

import { deleteSubscriber } from '../actions'

export type SubscriberRow = {
  id: string
  email: string
  locale: string
  joined: string
  joinedLabel: string
}

const helper = adminColumnHelper<SubscriberRow>()

const columns = helper.columns([
  helper.accessor('email', {
    header: 'Email',
    cell: (info) => <span className="break-all">{info.getValue()}</span>,
  }),
  helper.accessor('locale', { header: 'Bahasa', cell: (info) => info.getValue().toUpperCase() }),
  helper.accessor('joined', {
    header: 'Mendaftar',
    cell: (info) => (
      <span className="text-muted tabular-nums">{info.row.original.joinedLabel}</span>
    ),
  }),
  helper.display({
    id: 'actions',
    header: () => <span className="sr-only">Aksi</span>,
    cell: (info) => (
      <div className="flex justify-end">
        <ConfirmDelete
          itemLabel={info.row.original.email}
          onConfirm={() => deleteSubscriber(info.row.original.id)}
        />
      </div>
    ),
  }),
])

export function SubscriberTable({ rows }: { rows: SubscriberRow[] }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel="Cari email"
      emptyText="Belum ada pelanggan di daftar ini."
      pageSize={50}
      renderCard={(row) => (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium break-all">{row.email}</p>
            <p className="mt-1 text-sm text-muted">
              {row.locale.toUpperCase()} · {row.joinedLabel}
            </p>
          </div>
          <ConfirmDelete itemLabel={row.email} onConfirm={() => deleteSubscriber(row.id)} />
        </Card>
      )}
    />
  )
}
