import { ChevronDown, ExternalLink, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ACTION_FILTERS,
  ACTION_LABEL,
  ACTION_VERB,
  ENTITY_LABEL,
  ENTITY_NOUN,
  fieldLabel,
  VALUE_LABEL,
} from '@/features/audit/labels'
import {
  AUDIT_MAX_ROWS,
  AUDIT_STEP,
  auditTargetKey,
  listAuditFeed,
  resolveAuditTargets,
  SINGLE_ENTITY_HREF,
} from '@/features/audit/queries'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { DISPLAY_TIME_ZONE, jakartaDayKey } from '@/lib/format'
import { cn } from '@/lib/utils'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Log audit') }
}

type Change = { before: unknown; after: unknown }
type T = Awaited<ReturnType<typeof getAdminT>>['t']

const ACTIONS = new Set(Object.keys(ACTION_VERB))
// kolom yang tidak berarti bagi pembaca log
const HIDDEN_FIELDS = new Set(['id', 'updatedAt', 'createdAt'])

type Params = { q: string | null; action: string | null; entity: string | null; n: number }

function href(p: Params, patch: Partial<Params> = {}) {
  const next = { ...p, ...patch }
  const params = new URLSearchParams()
  if (next.q) params.set('q', next.q)
  if (next.action) params.set('action', next.action)
  if (next.entity) params.set('entity', next.entity)
  if (next.n > AUDIT_STEP) params.set('n', String(next.n))
  const q = params.toString()
  return q ? `/admin/audit?${q}` : '/admin/audit'
}

function parseParams(sp: Record<string, string | string[] | undefined>): Params {
  const str = (v: unknown) => (typeof v === 'string' ? v : null)
  const q = str(sp.q)?.trim().slice(0, 80) || null
  const action = str(sp.action)
  const entity = str(sp.entity)
  const n = Number.parseInt(str(sp.n) ?? '', 10)
  return {
    q,
    action: action && ACTIONS.has(action) ? action : null,
    entity: entity && /^[A-Za-z]{1,40}$/.test(entity) ? entity : null,
    n: Number.isFinite(n) ? Math.min(AUDIT_MAX_ROWS, Math.max(AUDIT_STEP, n)) : AUDIT_STEP,
  }
}

// Judul kelompok hari menurut WIB: Hari ini, Kemarin, lalu tanggal lengkap.
function dayTitle(dayKey: string, todayKey: string, lang: 'id' | 'en', t: T) {
  const day = new Date(`${dayKey}T00:00:00Z`)
  const today = new Date(`${todayKey}T00:00:00Z`)
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000)
  if (diff === 0) return t('Hari ini')
  if (diff === 1) return t('Kemarin')
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: day.getUTCFullYear() === today.getUTCFullYear() ? undefined : 'numeric',
  }).format(day)
}

function timeOf(date: Date, lang: 'id' | 'en') {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function isEmpty(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

function show(value: unknown, t: T) {
  if (isEmpty(value)) return '—'
  if (typeof value === 'boolean') return value ? t('Aktif') : t('Mati')
  if (typeof value === 'string') {
    if (value in VALUE_LABEL) return t(VALUE_LABEL[value]!)
    // waktu ISO dari snapshot → tanggal WIB
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) return `${jakartaDayKey(d)} ${timeOf(d, 'id')}`
    }
    return value
  }
  return JSON.stringify(value)
}

// Nama data yang sudah tidak ada lagi (dihapus), diambil dari isi perubahan baris itu.
function nameFromDiff(changes: Record<string, Change>, lang: 'id' | 'en') {
  const pick = (k: string) => {
    const c = changes[k]
    const v = c?.before ?? c?.after
    return typeof v === 'string' && v ? v : null
  }
  return (
    (lang === 'en' ? pick('title_en') : null) ??
    pick('title_id') ??
    (lang === 'en' ? pick('name_en') : null) ??
    pick('name_id') ??
    pick('name') ??
    pick('subject') ??
    pick('organization') ??
    pick('device')
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '·'
  )
}

// Log audit, desain 1 "Umpan per hari" (pilihan pemilik 2026-11-11, DESIGN.md bagian 121): kalimat
// biasa dikelompokkan per hari WIB, klik baris untuk melihat kolom yang berubah. Saring dengan
// pencarian, aksi, dan entitas; "Muat lagi" menambah 50 baris. Bekerja tanpa JavaScript.
export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireSuperAdminPage()
  const p = parseParams(await searchParams)
  const { lang, t } = await getAdminT()
  const { rows, hasMore, entities } = await listAuditFeed({
    q: p.q,
    action: p.action,
    entity: p.entity,
    take: p.n,
  })
  const targets = await resolveAuditTargets(rows, lang)
  // Nama data yang sudah dihapus: dari baris lain untuk data yang sama (mis. baris hapus menyimpan
  // judul project), agar baris "mengubah project" sebelumnya tetap menyebut namanya.
  const namesFromRows = new Map<string, string>()
  for (const row of rows) {
    const key = auditTargetKey(row.entity, row.entityId)
    const name = key && nameFromDiff((row.diff ?? {}) as Record<string, Change>, lang)
    if (key && name && !namesFromRows.has(key)) namesFromRows.set(key, name)
  }
  const todayKey = jakartaDayKey(new Date())
  const filtered = Boolean(p.q || p.action || p.entity)

  // kelompok per hari WIB, urutan tetap terbaru dulu
  const days: { key: string; rows: typeof rows }[] = []
  for (const row of rows) {
    const key = jakartaDayKey(row.createdAt)
    const last = days.at(-1)
    if (last?.key === key) last.rows.push(row)
    else days.push({ key, rows: [row] })
  }

  const chip = (active: boolean) =>
    cn(
      'inline-flex min-h-9 items-center rounded-md border px-3 text-sm transition-colors',
      active ? 'border-text bg-text text-bg' : 'border-border-strong text-muted hover:text-text',
    )

  return (
    <>
      {/* deskripsi dihapus (revisi pemilik 2026-11-11) */}
      <PageHeader title="Log audit" />

      <div className="mb-6 flex flex-col gap-3">
        <form action="/admin/audit" method="get" role="search" className="flex gap-2">
          {p.action ? <input type="hidden" name="action" value={p.action} /> : null}
          {p.entity ? <input type="hidden" name="entity" value={p.entity} /> : null}
          <label htmlFor="audit-q" className="sr-only">
            {t('Cari target atau kolom')}
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              id="audit-q"
              name="q"
              type="search"
              defaultValue={p.q ?? ''}
              maxLength={80}
              placeholder={t('Cari target atau kolom')}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t('Cari')}
          </Button>
        </form>

        <nav aria-label={t('Saring aksi')} className="flex flex-wrap gap-1.5">
          <Link
            href={href(p, { action: null, n: AUDIT_STEP })}
            aria-current={!p.action ? 'page' : undefined}
            className={chip(!p.action)}
          >
            {t('Semua')}
          </Link>
          {ACTION_FILTERS.map((a) => (
            <Link
              key={a}
              href={href(p, { action: a, n: AUDIT_STEP })}
              aria-current={p.action === a ? 'page' : undefined}
              className={chip(p.action === a)}
            >
              {t(ACTION_LABEL[a]!)}
            </Link>
          ))}
        </nav>

        {entities.length > 1 ? (
          <nav aria-label={t('Saring entitas')} className="flex flex-wrap gap-1.5">
            <Link
              href={href(p, { entity: null, n: AUDIT_STEP })}
              aria-current={!p.entity ? 'page' : undefined}
              className={chip(!p.entity)}
            >
              {t('Semua data')}
            </Link>
            {entities.map((e) => (
              <Link
                key={e}
                href={href(p, { entity: e, n: AUDIT_STEP })}
                aria-current={p.entity === e ? 'page' : undefined}
                className={chip(p.entity === e)}
              >
                {t(ENTITY_LABEL[e] ?? e)}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          <p>{filtered ? t('Tidak ada catatan yang cocok.') : t('Belum ada catatan.')}</p>
          {filtered ? (
            <Link
              href="/admin/audit"
              className="mt-2 inline-block text-text underline underline-offset-4"
            >
              {t('Hapus saringan')}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <section
              key={day.key}
              aria-labelledby={`day-${day.key}`}
              className="flex flex-col gap-2"
            >
              <h2 id={`day-${day.key}`} className="px-1 text-sm font-medium text-muted">
                {dayTitle(day.key, todayKey, lang, t)}
              </h2>
              <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {day.rows.map((row) => {
                  const changes = (row.diff ?? {}) as Record<string, Change>
                  const fields = Object.entries(changes).filter(([k]) => !HIDDEN_FIELDS.has(k))
                  const key = auditTargetKey(row.entity, row.entityId)
                  const target = key ? targets.get(key) : undefined
                  const name =
                    target?.name ??
                    nameFromDiff(changes, lang) ??
                    (key ? namesFromRows.get(key) : undefined) ??
                    null
                  const link =
                    row.action === 'delete'
                      ? null
                      : (target?.href ?? SINGLE_ENTITY_HREF[row.entity] ?? null)
                  const actor = row.actor?.name ?? t('Sistem')
                  const noun = target?.noun ?? ENTITY_NOUN[row.entity] ?? row.entity
                  const time = timeOf(row.createdAt, lang)
                  return (
                    <li key={row.id} data-audit={row.action} data-entity-id={row.entityId ?? ''}>
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-text ring-2',
                              // warna cincin membedakan buat (hijau), hapus (merah), dan lainnya
                              row.action === 'delete'
                                ? 'ring-danger/70'
                                : row.action === 'create'
                                  ? 'ring-success/70'
                                  : 'ring-border-strong',
                            )}
                          >
                            {initials(actor)}
                          </span>
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="font-semibold">{actor}</span>{' '}
                            {row.action === 'password' ? (
                              t(ACTION_VERB.password!)
                            ) : (
                              <>
                                {t(ACTION_VERB[row.action] ?? row.action)} {t(noun)}
                                {name ? (
                                  <>
                                    {' '}
                                    <span className="font-semibold break-words">{name}</span>
                                  </>
                                ) : null}
                              </>
                            )}
                          </span>
                          <time
                            dateTime={row.createdAt.toISOString()}
                            className="shrink-0 font-mono text-xs text-muted tabular-nums"
                          >
                            {time}
                          </time>
                          <ChevronDown
                            className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="flex flex-col gap-3 px-4 pt-1 pb-4 sm:pl-15">
                          {row.action === 'password' ? (
                            <p className="text-sm text-muted">{t('Isi password tidak dicatat.')}</p>
                          ) : fields.length === 0 ? (
                            <p className="text-sm text-muted">
                              {t('Tidak ada kolom yang berubah.')}
                            </p>
                          ) : (
                            <div
                              // bisa digulir menyamping di HP, jadi bisa difokus keyboard
                              tabIndex={0}
                              role="region"
                              aria-label={t('Kolom yang berubah')}
                              className="overflow-x-auto rounded-md border border-border focus-visible:outline-2"
                            >
                              <table className="w-full text-left text-sm">
                                <caption className="sr-only">{t('Kolom yang berubah')}</caption>
                                <thead className="bg-surface-2 text-xs text-muted">
                                  <tr>
                                    <th scope="col" className="px-3 py-2 font-medium">
                                      {t('Kolom')}
                                    </th>
                                    <th scope="col" className="px-3 py-2 font-medium">
                                      {t('Sebelum')}
                                    </th>
                                    <th scope="col" className="px-3 py-2 font-medium">
                                      {t('Sesudah')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {fields.map(([field, change]) => {
                                    const label = fieldLabel(field)
                                    return (
                                      <tr key={field} className="align-top">
                                        <th
                                          scope="row"
                                          className="px-3 py-2 font-normal whitespace-nowrap"
                                        >
                                          {label ? (
                                            <>
                                              {t(label.base)}
                                              {label.lang ? (
                                                <span className="ml-1 text-xs text-muted">
                                                  {label.lang}
                                                </span>
                                              ) : null}
                                            </>
                                          ) : (
                                            <span className="font-mono text-xs">{field}</span>
                                          )}
                                        </th>
                                        <td
                                          className={cn(
                                            'max-w-80 px-3 py-2 break-words text-muted',
                                            // nilai lama dicoret, kecuali kosong
                                            !isEmpty(change.before) &&
                                              'line-through decoration-danger/60',
                                          )}
                                        >
                                          {show(change.before, t)}
                                        </td>
                                        <td className="max-w-80 px-3 py-2 break-words">
                                          {show(change.after, t)}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span>
                              {t(ENTITY_LABEL[row.entity] ?? row.entity)}
                              {row.entityId ? (
                                <span className="ml-1 font-mono">{row.entityId.slice(0, 8)}</span>
                              ) : null}
                            </span>
                            <span>{`${jakartaDayKey(row.createdAt)} ${time} WIB`}</span>
                            {link ? (
                              <Link
                                href={link}
                                className="inline-flex items-center gap-1 text-text underline underline-offset-4"
                              >
                                {t('Buka')}
                                <ExternalLink className="size-3" aria-hidden="true" />
                              </Link>
                            ) : null}
                          </p>
                        </div>
                      </details>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {hasMore && p.n < AUDIT_MAX_ROWS ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" asChild>
            <Link href={href(p, { n: Math.min(AUDIT_MAX_ROWS, p.n + AUDIT_STEP) })} scroll={false}>
              {t('Muat lagi')}
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  )
}
