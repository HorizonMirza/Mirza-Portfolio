import 'server-only'

import type { Prisma } from '@/generated/prisma/client'

// Kunci advisori Postgres per lingkup urutan (mis. "project", "skill:<kategori>") sampai transaksi
// selesai. Dipanggil tepat sebelum menghitung `order = max + 1`, sehingga dua item yang dibuat
// bersamaan tidak mendapat urutan kembar (audit 2026-11-02, DB-05). Query berparameter; kunci
// dilepas otomatis saat commit/rollback.
export async function lockOrderScope(tx: Prisma.TransactionClient, scope: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${scope}`}))`
}
