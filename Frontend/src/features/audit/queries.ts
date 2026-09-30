import 'server-only'

import { getDb } from '@/lib/db'

export const AUDIT_PAGE_SIZE = 50

export async function listAuditLogs({ entity, page }: { entity: string | null; page: number }) {
  const where = entity ? { entity } : {}
  const [rows, total, entities] = await Promise.all([
    getDb().auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        diff: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
    getDb().auditLog.count({ where }),
    getDb().auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' },
    }),
  ])
  return { rows, total, entities: entities.map((e) => e.entity) }
}
