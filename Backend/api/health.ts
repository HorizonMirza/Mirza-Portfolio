// Logika rute /api/health untuk uptime monitor: memeriksa koneksi database. Tidak mengembalikan detail
// internal (versi, host, pesan galat).

import { getDb } from '@backend/lib/db'

export async function GET() {
  const startedAt = Date.now()
  try {
    await getDb().$queryRaw`SELECT 1`
    return Response.json(
      { status: 'ok', database: 'ok', latencyMs: Date.now() - startedAt },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      { status: 'error', database: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
