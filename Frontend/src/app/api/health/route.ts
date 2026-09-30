import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Dipakai uptime monitor. Tidak mengembalikan detail internal (versi, host, pesan galat).
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
