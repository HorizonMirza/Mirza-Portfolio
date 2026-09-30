import 'server-only'

import type { Prisma } from '@/generated/prisma/client'

type Tx = Prisma.TransactionClient
type Snapshot = Record<string, unknown>

const MAX_TEXT = 300

function compact(value: unknown): unknown {
  if (typeof value === 'string' && value.length > MAX_TEXT) return `${value.slice(0, MAX_TEXT)}…`
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  return value
}

// Hanya field yang berubah, dengan teks panjang dipotong agar tabel audit tetap kecil.
export function diffSnapshots(before: Snapshot | null, after: Snapshot | null) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  for (const key of keys) {
    if (key === 'updatedAt' || key === 'createdAt') continue
    const a = compact(before?.[key])
    const b = compact(after?.[key])
    if (JSON.stringify(a) !== JSON.stringify(b))
      changes[key] = { before: a ?? null, after: b ?? null }
  }
  return changes
}

// Wajib dipanggil di transaksi yang sama dengan perubahan datanya.
export async function writeAudit(
  tx: Tx,
  input: {
    actorId: string
    action: 'create' | 'update' | 'delete' | 'reorder' | 'import'
    entity: string
    entityId?: string | null
    before?: Snapshot | null
    after?: Snapshot | null
  },
) {
  const diff = diffSnapshots(input.before ?? null, input.after ?? null)
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      diff: diff as Prisma.InputJsonValue,
    },
  })
}
