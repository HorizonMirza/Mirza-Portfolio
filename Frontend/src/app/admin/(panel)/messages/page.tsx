import type { Metadata } from 'next'
import Link from 'next/link'

import { FilterTabs } from '@/components/admin/filter-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Pager, parsePage } from '@/components/admin/pager'
import { Badge } from '@/components/ui/badge'
import { DeleteMessageButton } from '@/features/messages/components/message-actions'
import {
  countMessagesByStatus,
  listMessages,
  MESSAGE_PREVIEW_CHARS,
  MESSAGES_PAGE_SIZE,
} from '@/features/messages/queries'
import {
  MESSAGE_STATUSES,
  messageStatusLabel,
  parseMessageStatus,
} from '@/features/messages/schema'
import { getAdminT } from '@/lib/admin-lang-server'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime } from '@/lib/format'

// judul tab browser ikut bahasa admin
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT()
  return { title: t('Pesan') }
}

export default async function MessagesPage({ searchParams }: PageProps<'/admin/messages'>) {
  await requireSuperAdminPage()
  const sp = await searchParams
  const status = parseMessageStatus(sp.status)
  const page = parsePage(sp.page)
  const [messages, counts] = await Promise.all([
    listMessages(status, page),
    countMessagesByStatus(),
  ])
  const pages = Math.max(1, Math.ceil(counts[status] / MESSAGES_PAGE_SIZE))
  const base = status === 'NEW' ? '/admin/messages' : `/admin/messages?status=${status}`
  const { lang, t } = await getAdminT()
  const pageHref = (p: number) =>
    p === 1 ? base : `${base}${base.includes('?') ? '&' : '?'}page=${p}`

  return (
    <>
      <PageHeader title="Pesan" />
      <FilterTabs
        stretch
        label={t('Filter Status Pesan')}
        items={MESSAGE_STATUSES.map((s) => ({
          href: s === 'NEW' ? '/admin/messages' : `/admin/messages?status=${s}`,
          label: t(messageStatusLabel[s]),
          count: counts[s],
          active: s === status,
        }))}
      />
      {messages.length === 0 ? (
        <p className="admin-bleed rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {status === 'NEW'
            ? t('Tidak ada pesan baru.')
            : t('Tidak ada pesan berstatus {status}.', {
                status: t(messageStatusLabel[status]).toLowerCase(),
              })}
        </p>
      ) : (
        <ul className="admin-bleed divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {messages.map((m) => (
            <li key={m.id} className="flex items-center hover:bg-surface-2">
              <Link
                href={`/admin/messages/${m.id}`}
                className="flex min-w-0 flex-1 flex-col gap-1 py-3 ps-4 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="flex min-w-0 items-center gap-2 sm:w-52 sm:shrink-0">
                  {m.status === 'NEW' ? <Badge tone="primary">{t('Baru')}</Badge> : null}
                  <span className="font-medium [overflow-wrap:anywhere]">{m.name}</span>
                </span>
                {/* cuplikan isi (dipendekkan di server); turun baris bila tidak muat, tidak dipotong
                    lagi oleh lebar layar (revisi pemilik 2026-11-17) */}
                <span className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">
                  {m.subject ? <span className="font-medium">{m.subject} · </span> : null}
                  <span className="text-muted">
                    {m.body.length > MESSAGE_PREVIEW_CHARS
                      ? `${m.body.slice(0, MESSAGE_PREVIEW_CHARS).trimEnd()}…`
                      : m.body}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {formatDateTime(m.createdAt, lang)}
                </span>
              </Link>
              <span className="shrink-0 px-2">
                <DeleteMessageButton id={m.id} name={m.name} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pager label={t('Halaman Pesan')} page={page} pages={pages} href={pageHref} />
    </>
  )
}
