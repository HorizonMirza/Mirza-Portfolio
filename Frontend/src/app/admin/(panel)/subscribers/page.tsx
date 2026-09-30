import type { Metadata } from 'next'

import { FilterTabs } from '@/components/admin/filter-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { SubscriberTable } from '@/features/subscribers/components/subscriber-table'
import { countSubscribersByStatus, listSubscribers } from '@/features/subscribers/queries'
import {
  parseSubscriberStatus,
  SUBSCRIBER_STATUSES,
  subscriberStatusLabel,
} from '@/features/subscribers/schema'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Pelanggan' }

export default async function SubscribersPage({ searchParams }: PageProps<'/admin/subscribers'>) {
  await requireSuperAdminPage()
  const status = parseSubscriberStatus((await searchParams).status)
  const [subscribers, counts] = await Promise.all([
    listSubscribers(status),
    countSubscribersByStatus(),
  ])
  return (
    <>
      <PageHeader
        eyebrow="Newsletter"
        title="Pelanggan"
        description="Hanya pelanggan terkonfirmasi (double opt-in) yang akan menerima email. Pengiriman broadcast menunggu keputusan pemilik (PRD bagian 11)."
      />
      <FilterTabs
        label="Filter status pelanggan"
        items={SUBSCRIBER_STATUSES.map((s) => ({
          href: s === 'CONFIRMED' ? '/admin/subscribers' : `/admin/subscribers?status=${s}`,
          label: subscriberStatusLabel[s],
          count: counts[s],
          active: s === status,
        }))}
      />
      <SubscriberTable
        rows={subscribers.map((s) => {
          const joined = s.confirmedAt ?? s.createdAt
          return {
            id: s.id,
            email: s.email,
            locale: s.locale,
            joined: joined.toISOString(),
            joinedLabel: formatDateTime(joined),
          }
        })}
      />
    </>
  )
}
