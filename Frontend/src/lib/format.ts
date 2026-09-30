// Semua waktu disimpan UTC dan ditampilkan dalam zona Asia/Jakarta (CLAUDE.md, pelajaran GAAS F-01).
export const DISPLAY_TIME_ZONE = 'Asia/Jakarta'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: 'medium',
})

const shortDayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
})

export function formatDateTime(date: Date): string {
  return `${dateTimeFormatter.format(date)} WIB`
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}

// Kunci hari kalender (YYYY-MM-DD) menurut Asia/Jakarta.
export function jakartaDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TIME_ZONE }).format(date)
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
