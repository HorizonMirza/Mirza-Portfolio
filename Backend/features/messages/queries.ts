import 'server-only'

import type { MessageStatus } from '@backend/generated/prisma/client'
import { getDb } from '@backend/lib/db'

export const MESSAGES_PAGE_SIZE = 50

// Panjang cuplikan isi pesan di daftar sebelum dipotong dengan "…"
export const MESSAGE_PREVIEW_CHARS = 48

export type MessageListRow = {
  id: string
  name: string
  email: string
  subject: string | null
  // hanya MESSAGE_PREVIEW_CHARS + 1 karakter pertama (satu lebih, supaya daftar tahu isinya lebih panjang)
  body: string
  status: MessageStatus
  createdAt: Date
}

// Per halaman (dulu dipotong diam-diam di 500 pesan, sisanya tidak bisa dibuka). Isi pesan dipotong
// di database: daftar hanya menampilkan cuplikan, sedangkan isi penuh (sampai 5.000 karakter) dulu ikut
// diambil untuk 50 pesan sekaligus (259 KB lawan 11 KB; audit 2026-11-17, EFF-01). Isi lengkap
// dibaca di getMessage. Query berparameter, tanpa menyambung teks.
export async function listMessages(status: MessageStatus, page = 1) {
  const take = MESSAGES_PAGE_SIZE
  const skip = (page - 1) * MESSAGES_PAGE_SIZE
  return getDb().$queryRaw<MessageListRow[]>`
    SELECT "id", "name", "email", "subject",
           left("body", ${MESSAGE_PREVIEW_CHARS + 1}::int) AS "body",
           "status", "createdAt"
    FROM "Message"
    WHERE "status" = ${status}::"MessageStatus"
    ORDER BY "createdAt" DESC, "id" DESC
    LIMIT ${take}::int OFFSET ${skip}::int`
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
