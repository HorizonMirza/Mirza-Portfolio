// Jendela ringkasan kunjungan harian (cron /api/cron/daily).
// masa simpan kunjungan mentah, juga dipakai cron untuk menghapus data lama
export const RETENTION_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

// Awal jendela ringkasan: hari ringkasan terakhir dikurangi satu hari (diringkas ulang, idempoten,
// juga menutup selisih zona WIB), atau 8 hari lalu bila itu lebih awal. Belum pernah ada ringkasan:
// semua kunjungan mentah (paling lama 90 hari). Dulu hanya 8 hari terakhir, sehingga cron yang gagal
// lebih dari seminggu meninggalkan hari yang tidak pernah diringkas lalu terhapus di hari ke-90
// (audit 2026-11-02, DB-06).
export function summaryStart(latestSummary: Date | null, now: number = Date.now()): Date {
  const recent = new Date(now - 8 * DAY_MS)
  if (!latestSummary) return new Date(now - (RETENTION_DAYS + 1) * DAY_MS)
  const fromLatest = new Date(latestSummary.getTime() - DAY_MS)
  return fromLatest < recent ? fromLatest : recent
}
