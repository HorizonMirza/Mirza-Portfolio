// Alamat API yang tidak ada dijawab JSON 404 { error }, bukan halaman 404 HTML bawaan Next berbahasa
// Inggris (audit 2026-11-03, temuan lanjutan 404 global). Rute API yang ada (auth, cron, cv, health,
// track) lebih spesifik sehingga tetap didahulukan.
function notFound() {
  return Response.json(
    { error: { code: 'NOT_FOUND', message: 'Alamat API tidak ditemukan' } },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const GET = notFound
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
