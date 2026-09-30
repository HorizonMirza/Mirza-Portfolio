'use client'

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Fitur tabel admin: cari global, urut per kolom, paginasi. Didaftarkan eksplisit (TanStack Table v9).
export const adminTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
})

export function adminColumnHelper<T extends Record<string, unknown>>() {
  return createColumnHelper<typeof adminTableFeatures, T>()
}

type DataTableProps<T extends Record<string, unknown>> = {
  data: T[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipe kolom campuran dari helper
  columns: any[]
  searchLabel: string
  emptyText: string
  // tampilan kartu untuk layar kecil (DESIGN.md: tabel admin jadi kartu di HP)
  renderCard: (row: T) => ReactNode
  getRowId: (row: T) => string
  pageSize?: number
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchLabel,
  emptyText,
  renderCard,
  getRowId,
  pageSize = 20,
}: DataTableProps<T>) {
  const table = useTable({
    features: adminTableFeatures,
    columns,
    data,
    getRowId,
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })
  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block max-w-sm">
        <span className="sr-only">{searchLabel}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder={searchLabel}
          value={String(table.state.globalFilter ?? '')}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="pl-9"
        />
      </label>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>{renderCard(row.original)}</li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      const sorted = header.column.getIsSorted()
                      const canSort = header.column.getCanSort()
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-4 py-2 font-medium"
                          aria-sort={
                            sorted === 'asc'
                              ? 'ascending'
                              : sorted === 'desc'
                                ? 'descending'
                                : undefined
                          }
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex min-h-9 items-center gap-1 hover:text-text"
                            >
                              <table.FlexRender header={header} />
                              {sorted === 'asc' ? (
                                <ArrowUp className="size-3.5" aria-hidden="true" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown className="size-3.5" aria-hidden="true" />
                              ) : (
                                <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border bg-surface">
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {table.getPageCount() > 1 ? (
        <nav aria-label="Halaman tabel" className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted">
            Halaman {table.state.pagination.pageIndex + 1} dari {table.getPageCount()}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </nav>
      ) : null}
    </div>
  )
}
