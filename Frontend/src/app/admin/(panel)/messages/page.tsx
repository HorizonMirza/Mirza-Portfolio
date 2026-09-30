import type { Metadata } from 'next'
import Link from 'next/link'

import { FilterTabs } from '@/components/admin/filter-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { countMessagesByStatus, listMessages } from '@/features/messages/queries'
import {
  MESSAGE_STATUSES,
  messageStatusLabel,
  parseMessageStatus,
} from '@/features/messages/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Pesan' }

export default async function MessagesPage({ searchParams }: PageProps<'/admin/messages'>) {
  await requireSuperAdminPage()
  const status = parseMessageStatus((await searchParams).status)
  const [messages, counts] = await Promise.all([listMessages(status), countMessagesByStatus()])

  return (
    <>
      <PageHeader
        eyebrow="Kotak masuk"
        title="Pesan"
        description="Pesan dari formulir kontak. Waktu dalam WIB."
      />
      <FilterTabs
        label="Filter status pesan"
        items={MESSAGE_STATUSES.map((s) => ({
          href: s === 'NEW' ? '/admin/messages' : `/admin/messages?status=${s}`,
          label: messageStatusLabel[s],
          count: counts[s],
          active: s === status,
        }))}
      />
      {messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          {status === 'NEW'
            ? 'Tidak ada pesan baru.'
            : `Tidak ada pesan berstatus ${messageStatusLabel[status].toLowerCase()}.`}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {messages.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/messages/${m.id}`}
                className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-2 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <span className="flex min-w-0 items-center gap-2 sm:w-56 sm:shrink-0">
                  {m.status === 'NEW' ? <Badge tone="primary">Baru</Badge> : null}
                  <span className="truncate font-medium">{m.name}</span>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {m.subject ? <span className="font-medium">{m.subject} · </span> : null}
                  <span className="text-muted">{m.body.slice(0, 140)}</span>
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {formatDateTime(m.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
