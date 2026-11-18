// Semua waktu disimpan UTC dan ditampilkan dalam zona Asia/Jakarta (CLAUDE.md, pelajaran GAAS F-01).
export const DISPLAY_TIME_ZONE = 'Asia/Jakarta'

// Bahasa tampilan: 'id' (bawaan) atau 'en' untuk panel admin berbahasa Inggris (revisi 2026-11-11).
type DisplayLang = 'id' | 'en'
const LOCALE: Record<DisplayLang, string> = { id: 'id-ID', en: 'en-US' }

const dateTimeFormatters = {
  id: new Intl.DateTimeFormat(LOCALE.id, {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
  en: new Intl.DateTimeFormat(LOCALE.en, {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
}

const shortDayFormatters = {
  id: new Intl.DateTimeFormat(LOCALE.id, { timeZone: 'UTC', day: 'numeric', month: 'short' }),
  en: new Intl.DateTimeFormat(LOCALE.en, { timeZone: 'UTC', day: 'numeric', month: 'short' }),
}

export function formatDateTime(date: Date, lang: DisplayLang = 'id'): string {
  return `${dateTimeFormatters[lang].format(date)} WIB`
}

// en-CA menghasilkan format YYYY-MM-DD. Formatter dibuat sekali, bukan tiap panggilan
// (dipanggil per baris kunjungan di dasbor; audit 2026-10-31, EFF-05).
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TIME_ZONE })

// Kunci hari kalender (YYYY-MM-DD) menurut Asia/Jakarta.
export function jakartaDayKey(date: Date): string {
  return dayKeyFormatter.format(date)
}

// Label singkat untuk kunci hari, mis. "30 Sep" (en: "Sep 30").
export function formatDayKey(dayKey: string, lang: DisplayLang = 'id'): string {
  return shortDayFormatters[lang].format(new Date(`${dayKey}T00:00:00Z`))
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

// Angka sesuai bahasa tampilan (1.200 atau 1,200)
export function formatNumber(value: number, lang: DisplayLang = 'id'): string {
  return value.toLocaleString(LOCALE[lang])
}
