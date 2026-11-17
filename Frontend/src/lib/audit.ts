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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Kolom JSON berupa objek (mis. volume suara: sembilan angka) dibandingkan per kunci, supaya
// perubahan satu kunci tidak menyalin seluruh objek ke log (audit 2026-11-17, EFF-03).
function changedKeys(a: Record<string, unknown>, b: Record<string, unknown>) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  )
}

function pick(source: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, source[k] ?? null]))
}

// Hanya field yang berubah, dengan teks panjang dipotong agar tabel audit tetap kecil.
export function diffSnapshots(before: Snapshot | null, after: Snapshot | null) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  for (const key of keys) {
    if (key === 'updatedAt' || key === 'createdAt') continue
    const a = compact(before?.[key])
    const b = compact(after?.[key])
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    if (isPlainObject(a) && isPlainObject(b)) {
      const sub = changedKeys(a, b)
      changes[key] = { before: pick(a, sub), after: pick(b, sub) }
    } else changes[key] = { before: a ?? null, after: b ?? null }
  }
  return changes
}

// Wajib dipanggil di transaksi yang sama dengan perubahan datanya.
export async function writeAudit(
  tx: Tx,
  input: {
    actorId: string
    // signout: sesi di perangkat lain dikeluarkan dari Admin → Akun
    action: 'create' | 'update' | 'delete' | 'reorder' | 'password' | 'signout'
    entity: string
    entityId?: string | null
    before?: Snapshot | null
    after?: Snapshot | null
  },
) {
  const diff = diffSnapshots(input.before ?? null, input.after ?? null)
  // Simpan tanpa perubahan tidak menulis baris (audit 2026-11-17, EFF-02 dan EFF-03): log audit tidak
  // dibersihkan otomatis, jadi baris kosong hanya menumpuk.
  if (input.action === 'update' && Object.keys(diff).length === 0) return
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
