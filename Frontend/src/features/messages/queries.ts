import 'server-only'

import type { MessageStatus } from '@/generated/prisma/client'
import { getDb } from '@/lib/db'

export async function listMessages(status: MessageStatus) {
  return getDb().message.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      body: true,
      status: true,
      createdAt: true,
    },
  })
}

export async function countMessagesByStatus() {
  const rows = await getDb().message.groupBy({ by: ['status'], _count: { _all: true } })
  const counts = { NEW: 0, READ: 0, ARCHIVED: 0 }
  for (const r of rows) counts[r.status] = r._count._all
  return counts
}

export async function getMessage(id: string) {
  return getDb().message.findUnique({ where: { id } })
}
