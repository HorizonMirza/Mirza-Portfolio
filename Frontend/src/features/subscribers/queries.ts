import 'server-only'

import type { SubscriberStatus } from '@/generated/prisma/client'
import { getDb } from '@/lib/db'

export async function listSubscribers(status: SubscriberStatus) {
  return getDb().subscriber.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: {
      id: true,
      email: true,
      locale: true,
      createdAt: true,
      confirmedAt: true,
      unsubscribedAt: true,
    },
  })
}

export async function countSubscribersByStatus() {
  const rows = await getDb().subscriber.groupBy({ by: ['status'], _count: { _all: true } })
  const counts = { PENDING: 0, CONFIRMED: 0, UNSUBSCRIBED: 0 }
  for (const r of rows) counts[r.status] = r._count._all
  return counts
}
