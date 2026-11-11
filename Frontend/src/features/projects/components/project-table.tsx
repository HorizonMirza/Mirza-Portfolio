'use client'

import { Pencil, Star } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useAdminLang, useAdminT } from '@/components/admin/admin-lang'
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
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  category: keyof typeof projectCategoryLabel
  year: number
  featured: boolean
  updatedAt: string
  position: number
}

const helper = adminColumnHelper<Row>()

function RowActions({ row, total }: { row: Row; total: number }) {
  const t = useAdminT()
  return (
    <div className="flex items-center justify-end gap-1">
      <ReorderButtons
        itemLabel={row.title}
        isFirst={row.position === 0}
        isLast={row.position === total - 1}
        onMove={(dir) => moveProject(row.id, dir)}
      />
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/projects/${row.id}`} aria-label={t('Ubah {item}', { item: row.title })}>
          <Pencil aria-hidden="true" />
          <span className="sr-only md:not-sr-only">{t('Ubah')}</span>
        </Link>
      </Button>
      <ConfirmDelete itemLabel={row.title} onConfirm={() => deleteProject(row.id)} />
    </div>
  )
}

export function ProjectTable({ rows }: { rows: Omit<Row, 'position'>[] }) {
  const t = useAdminT()
  const { lang } = useAdminLang()
  const data = useMemo(() => rows.map((r, position) => ({ ...r, position })), [rows])
  const total = data.length
  // Urutan project diatur manual (tombol naik/turun) dan sama dengan situs publik, jadi kolom tidak
  // bisa diurutkan dengan klik judul kolom: urutan sementara itu menyesatkan dan bentrok dengan nomor.
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('position', {
          enableSorting: false,
          header: t('No'),
          cell: (info) => <span className="text-muted tabular-nums">{info.getValue() + 1}</span>,
        }),
        helper.accessor('title', {
          enableSorting: false,
          header: t('Judul'),
          cell: (info) => (
            <span className="flex items-center gap-2 font-medium">
              {info.row.original.featured ? (
                <Star className="size-4 fill-primary text-primary" aria-label={t('Unggulan')} />
              ) : null}
              {info.getValue()}
            </span>
          ),
        }),
        helper.accessor('category', {
          enableSorting: false,
          header: t('Kategori'),
          cell: (info) => t(projectCategoryLabel[info.getValue()]),
        }),
        helper.accessor('year', {
          enableSorting: false,
          header: t('Tahun'),
          cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
        }),
        helper.accessor('status', {
          enableSorting: false,
          header: t('Status'),
          cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        helper.accessor('updatedAt', {
          enableSorting: false,
          header: t('Diubah'),
          cell: (info) => (
            <span className="text-muted">{formatDateTime(new Date(info.getValue()), lang)}</span>
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('Aksi')}</span>,
          cell: (info) => <RowActions row={info.row.original} total={total} />,
        }),
      ]),
    [total, t, lang],
  )

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      searchLabel={t('Cari project')}
      emptyText={t('Belum ada project yang cocok.')}
      renderCard={(row) => (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{row.title}</p>
              <p className="mt-1 text-sm text-muted">
                {t(projectCategoryLabel[row.category])} · {row.year}
                {row.featured ? ` · ${t('unggulan')}` : ''}
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
