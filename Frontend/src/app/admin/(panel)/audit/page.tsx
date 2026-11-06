import type { Metadata } from 'next'
import { FilterTabs } from '@/components/admin/filter-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Pager, parsePage } from '@/components/admin/pager'
import { Badge } from '@/components/ui/badge'
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

// nama entitas di database → nama yang dikenal di panel (dulu tampil mentah, mis. "SiteText")
const entityLabel: Record<string, string> = {
  Asset: 'Berkas',
  Experience: 'Pengalaman',
  Message: 'Pesan',
  Profile: 'Profil',
  Project: 'Project',
  SiteSetting: 'Pengaturan',
  SiteText: 'Teks situs',
  Skill: 'Skill',
  SkillCategory: 'Kategori skill',
  User: 'Akun',
}
const labelOf = (entity: string) => entityLabel[entity] ?? entity

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
  const page = parsePage(sp.page)
  const { rows, total, entities } = await listAuditLogs({ entity: entityParam, page })
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Log audit"
        description="Setiap perubahan dari panel admin tercatat di sini. Data pribadi pengunjung tidak ikut dicatat."
      />
      <FilterTabs
        label="Filter entitas"
        items={[null, ...entities].map((e) => ({
          href: href(e, 1),
          label: e ? labelOf(e) : 'Semua',
          active: e === entityParam,
        }))}
      />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          Belum ada catatan.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row) => {
            const changes = Object.entries((row.diff ?? {}) as Record<string, Change>)
            return (
              <li key={row.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
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
                  <span>{labelOf(row.entity)}</span>
                  {row.entityId ? (
                    <span className="text-xs text-muted">{row.entityId.slice(0, 8)}</span>
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
                          <dt className="text-xs text-muted">{field}</dt>
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

      <Pager label="Halaman log" page={page} pages={pages} href={(p) => href(entityParam, p)} />
    </>
  )
}
