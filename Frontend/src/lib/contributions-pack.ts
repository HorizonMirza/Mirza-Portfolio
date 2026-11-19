// Bentuk ringkas kalender kontribusi untuk dikirim dari server ke komponen klien (kartu GitHub di
// footer, ada di semua halaman publik). Hari-hari berurutan, jadi cukup menyimpan tanggal pertama,
// panjang minggu pertama, dan satu angka per hari (jumlah * 5 + tingkat). Sekitar 1 KB, bukan 12 KB
// JSON objek per hari.
export type PackedDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }

export type PackedContributions = {
  /** tanggal hari pertama (YYYY-MM-DD) */
  start: string
  /** jumlah hari di minggu pertama (1 sampai 7) */
  firstWeek: number
  /** jumlah * 5 + tingkat, satu per hari, dipisah koma */
  cells: string
}

const DAY_MS = 86_400_000

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

// null bila hari-harinya tidak berurutan (tidak seharusnya terjadi); pemanggil lalu tidak
// menampilkan grafik, bukan salah menampilkan tanggal.
export function packContributions(weeks: PackedDay[][]): PackedContributions | null {
  const days = weeks.flat()
  if (!days.length || !weeks[0]?.length || weeks[0].length > 7) return null
  for (let i = 0; i < days.length; i++) {
    if (days[i].date !== addDays(days[0].date, i)) return null
  }
  for (let w = 1; w < weeks.length - 1; w++) if (weeks[w].length !== 7) return null
  if (weeks.length > 1 && weeks[weeks.length - 1].length > 7) return null
  return {
    start: days[0].date,
    firstWeek: weeks[0].length,
    cells: days.map((d) => d.count * 5 + d.level).join(','),
  }
}

export function unpackContributions(packed: PackedContributions): PackedDay[][] {
  const values = packed.cells.split(',').map(Number)
  const days = values.map((v, i) => ({
    date: addDays(packed.start, i),
    count: Math.floor(v / 5),
    level: (v % 5) as PackedDay['level'],
  }))
  const weeks: PackedDay[][] = [days.slice(0, packed.firstWeek)]
  for (let i = packed.firstWeek; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}
