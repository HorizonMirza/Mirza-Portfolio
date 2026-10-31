// Semua waktu disimpan UTC dan ditampilkan dalam zona Asia/Jakarta (CLAUDE.md, pelajaran GAAS F-01).
export const DISPLAY_TIME_ZONE = 'Asia/Jakarta'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})

const shortDayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
})

export function formatDateTime(date: Date): string {
  return `${dateTimeFormatter.format(date)} WIB`
}

// en-CA menghasilkan format YYYY-MM-DD. Formatter dibuat sekali, bukan tiap panggilan
// (dipanggil per baris kunjungan di dasbor; audit 2026-10-31, EFF-05).
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TIME_ZONE })

// Kunci hari kalender (YYYY-MM-DD) menurut Asia/Jakarta.
export function jakartaDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

// Label singkat untuk kunci hari, mis. "30 Sep".
export function formatDayKey(dayKey: string): string {
  return shortDayFormatter.format(new Date(`${dayKey}T00:00:00Z`))
}

// Daftar kunci hari berurutan, `days` hari terakhir sampai hari ini (Asia/Jakarta).
export function lastDayKeys(days: number, now: Date = new Date()): string[] {
  const todayKey = jakartaDayKey(now)
  const today = new Date(`${todayKey}T00:00:00Z`)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - (days - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

// Kolom @db.Date disimpan tengah malam UTC, jadi ditampilkan dengan zona UTC agar bulannya tidak bergeser.
const monthFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Hanya dipakai formatPeriod (admin). Nama berbeda dari formatMonth di lib/localized.ts yang menerima
// "YYYY-MM" dan locale, agar impor otomatis tidak tertukar (audit 2026-10-31, EFF-06).
function formatDateMonth(date: Date): string {
  return monthFormatter.format(date)
}

export function formatPeriod(start: Date, end: Date | null): string {
  return `${formatDateMonth(start)} – ${end ? formatDateMonth(end) : 'sekarang'}`
}
