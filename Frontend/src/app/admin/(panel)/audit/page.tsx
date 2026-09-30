import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AUDIT_PAGE_SIZE, listAuditLogs } from '@/features/audit/queries'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Log audit' }

const actionLabel: Record<string, string> = {
  create: 'buat',
  update: 'ubah',
  delete: 'hapus',
  reorder: 'urutkan',
  import: 'impor',
  password: 'ganti password',
}

type Change = { before: unknown; after: unknown }

function show(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function href(entity: string | null, page: number) {
  const params = new URLSearchParams()
  if (entity) params.set('entity', entity)
  if (page > 1) params.set('page', String(page))
  const q = params.toString()
  return q ? `/admin/audit?${q}` : '/admin/audit'
}

export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireSuperAdminPage()
  const sp = await searchParams
  const entityParam =
    typeof sp.entity === 'string' && /^[A-Za-z]{1,40}$/.test(sp.entity) ? sp.entity : null
  const page = Math.max(1, Math.min(10_000, Number.parseInt(String(sp.page ?? '1'), 10) || 1))
  const { rows, total, entities } = await listAuditLogs({ entity: entityParam, page })
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE))

  return (
    <>
      <PageHeader
        eyebrow="Keamanan"
        title="Log audit"
        description="Setiap perubahan dari panel admin tercatat di sini. Data pribadi pengunjung tidak ikut dicatat."
      />
      <nav aria-label="Filter entitas" className="mb-4 flex flex-wrap gap-2">
        {[null, ...entities].map((e) => (
          <Link
            key={e ?? 'all'}
            href={href(e, 1)}
            aria-current={e === entityParam ? 'page' : undefined}
            className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-sm aria-[current=page]:border-primary aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary"
          >
            {e ?? 'Semua'}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          Belum ada catatan.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row) => {
            const changes = Object.entries((row.diff ?? {}) as Record<string, Change>)
            return (
              <li key={row.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <time dateTime={row.createdAt.toISOString()} className="text-muted tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </time>
                  <span className="font-medium">{row.actor?.name ?? 'Sistem'}</span>
                  <Badge
                    tone={
                      row.action === 'delete'
                        ? 'danger'
                        : row.action === 'create'
                          ? 'success'
                          : 'neutral'
                    }
                  >
                    {actionLabel[row.action] ?? row.action}
                  </Badge>
                  <span>{row.entity}</span>
                  {row.entityId ? (
                    <span className="font-mono text-xs text-muted">{row.entityId.slice(0, 8)}</span>
                  ) : null}
                </div>
                {changes.length > 0 ? (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-primary">
                      {changes.length} field berubah
                    </summary>
                    <dl className="mt-2 grid gap-2">
                      {changes.map(([field, change]) => (
                        <div key={field} className="rounded-md bg-surface-2 px-3 py-2">
                          <dt className="font-mono text-xs text-muted">{field}</dt>
                          <dd className="mt-1 break-words">
                            <span className="text-muted line-through decoration-danger/60">
                              {show(change.before)}
                            </span>
                            <span aria-hidden="true"> → </span>
                            <span className="sr-only"> menjadi </span>
                            <span>{show(change.after)}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}

      {pages > 1 ? (
        <nav aria-label="Halaman log" className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted">
            Halaman {page} dari {pages}
          </span>
          {page > 1 ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={href(entityParam, page - 1)}>Sebelumnya</Link>
            </Button>
          ) : null}
          {page < pages ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={href(entityParam, page + 1)}>Berikutnya</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}
