// Jendela ringkasan kunjungan harian (cron /api/cron/daily).
// Masa simpan kunjungan mentah terpanjang yang bisa dipilih di Admin → Pengaturan (30, 90, 365 hari).
// Hanya menentukan jendela ringkasan pertama; cron menghapus data lama memakai pilihan yang berlaku.
export const RETENTION_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

// Awal jendela ringkasan: hari ringkasan terakhir dikurangi satu hari (diringkas ulang, idempoten,
// juga menutup selisih zona WIB), atau 8 hari lalu bila itu lebih awal. Belum pernah ada ringkasan:
// semua kunjungan mentah yang masih ada. Dengan begitu cron yang gagal lebih dari seminggu tidak
// meninggalkan hari yang belum diringkas sebelum kunjungan mentahnya terhapus.
export function summaryStart(latestSummary: Date | null, now: number = Date.now()): Date {
  const recent = new Date(now - 8 * DAY_MS)
  if (!latestSummary) return new Date(now - (RETENTION_DAYS + 1) * DAY_MS)
  const fromLatest = new Date(latestSummary.getTime() - DAY_MS)
  return fromLatest < recent ? fromLatest : recent
}
