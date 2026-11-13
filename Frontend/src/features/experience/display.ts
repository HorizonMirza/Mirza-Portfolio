// Teks periode pengalaman yang sama di halaman Pengalaman situs dan daftar Admin → Experience
// (DESIGN.md bagian 145): lama bekerja dalam bulan, dihitung termasuk bulan mulai.
export function monthsBetween(start: string, end: string | null) {
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  const [ey, em] = end ? end.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1]
  return Math.max(1, (ey! - sy!) * 12 + (em! - sm!) + 1)
}

// "1 Tahun 3 Bulan"; teks tahun/bulan dari messages (Experience.durationYears/durationMonths)
export function durationText(
  start: string,
  end: string | null,
  tr: (key: 'durationYears' | 'durationMonths', values: { count: number }) => string,
) {
  const n = monthsBetween(start, end)
  const years = Math.floor(n / 12)
  const months = n % 12
  return [
    years ? tr('durationYears', { count: years }) : '',
    months ? tr('durationMonths', { count: months }) : '',
  ]
    .filter(Boolean)
    .join(' ')
}
