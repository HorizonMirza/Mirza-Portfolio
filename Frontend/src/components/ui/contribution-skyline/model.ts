// Perhitungan murni grafik kontribusi GitHub: tanggal, grid minggu x hari, level warna, statistik,
// tinggi batang, kamera 2D/3D, dan warna. Tanpa DOM, jadi bisa diuji di tests/unit.

import { GITHUB_PALETTE, type Palette } from '@backend/lib/github-palette'

export type ContributionDay = { date: string; count: number }
export type Cell = { date: string; count: number; level: number; week: number; day: number }
type Streak = { days: number; start: string | null; end: string | null }
export type ContributionStats = {
  total: number
  first: string | null
  last: string | null
  busiest: { count: number; date: string | null }
  longest: Streak
  current: Streak
}
export type RGB = [number, number, number]

const DAY_MS = 86400000

export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const easeInOutCubic = (x: number): number => {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3)
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Tengah malam UTC -> "YYYY-MM-DD". */
const toKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/**
 * Nilai tanggal apa pun -> tengah malam UTC hari kalendernya. String "YYYY-MM-DD" dibaca apa
 * adanya (tanpa geser zona waktu), Date menurut hari lokalnya, angka sebagai timestamp UTC.
 */
export const dayMs = (v: string | number | Date): number => {
  if (typeof v === 'number') return Math.floor(v / DAY_MS) * DAY_MS
  if (typeof v === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3])
    v = new Date(v)
  }
  return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())
}

/**
 * Grid: kolom adalah minggu, baris adalah hari (baris 0 = `weekStart`). Berakhir di `endMs` dan
 * dimulai dari minggu yang memuat hari setahun sebelumnya. Level 1-4 membagi hari bernilai menurut
 * porsinya terhadap hari sibuk (persentil 95), agar satu hari ekstrem tidak membuat hari lain pucat.
 */
export const buildGrid = (data: ContributionDay[], endMs: number, weekStart = 0) => {
  const counts = new Map<string, number>()
  for (const d of data) {
    if (!d || typeof d.date !== 'string') continue
    const ms = dayMs(d.date)
    const c = Number(d.count)
    if (!Number.isFinite(ms) || !(c > 0) || !Number.isFinite(c)) continue
    const k = toKey(ms)
    counts.set(k, (counts.get(k) ?? 0) + c)
  }
  let start = endMs - 364 * DAY_MS
  start -= ((new Date(start).getUTCDay() - weekStart + 7) % 7) * DAY_MS
  const cells: Cell[] = []
  for (let ms = start, i = 0; ms <= endMs; ms += DAY_MS, i++) {
    const date = toKey(ms)
    cells.push({
      date,
      count: counts.get(date) ?? 0,
      level: 0,
      week: Math.floor(i / 7),
      day: i % 7,
    })
  }
  const nz = cells
    .map((c) => c.count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b)
  const busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0
  for (const c of cells) c.level = levelOf(c.count, busy)
  return {
    cells,
    weeks: cells.length ? cells[cells.length - 1].week + 1 : 0,
    max: nz.length ? nz[nz.length - 1] : 0,
  }
}

/** 0 untuk hari kosong, selain itu 1-4 per seperempat `busy`. Sama atau melewati `busy` adalah 4. */
export const levelOf = (count: number, busy: number): number =>
  count <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((count / busy) * 4))

/** Total, hari tersibuk, rentetan terpanjang, dan rentetan yang sampai hari ini (atau kemarin). */
export const computeStats = (cells: Cell[]): ContributionStats => {
  let total = 0
  let best = 0
  let bestDate: string | null = null
  let run = 0
  let runStart: string | null = null
  let longest: Streak = { days: 0, start: null, end: null }
  for (const c of cells) {
    total += c.count
    if (c.count > best) {
      best = c.count
      bestDate = c.date
    }
    if (c.count > 0) {
      if (run === 0) runStart = c.date
      run++
      if (run > longest.days) longest = { days: run, start: runStart, end: c.date }
    } else run = 0
  }
  let j = cells.length - 1
  // hari ini belum selesai: bila masih kosong, rentetan dihitung sampai kemarin
  if (j >= 0 && cells[j].count === 0) j--
  const endAt = j
  while (j >= 0 && cells[j].count > 0) j--
  const days = endAt - j
  const current: Streak =
    days > 0
      ? { days, start: cells[j + 1].date, end: cells[endAt].date }
      : { days: 0, start: null, end: null }
  return {
    total,
    first: cells.length ? cells[0].date : null,
    last: cells.length ? cells[cells.length - 1].date : null,
    busiest: { count: best, date: bestDate },
    longest,
    current,
  }
}

/** Label di tiap minggu yang hari pertamanya memulai bulan baru; label pertama yang sempit dibuang. */
export const monthLabels = (cells: Cell[], weeks: number, locale = 'en-US') => {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
  const out: { week: number; label: string }[] = []
  let prev = -1
  for (let w = 0; w < weeks; w++) {
    const c = cells[w * 7]
    if (!c) break
    const m = +c.date.slice(5, 7)
    if (m !== prev) out.push({ week: w, label: fmt.format(dayMs(c.date)) })
    prev = m
  }
  if (out.length > 1 && out[1].week - out[0].week < 3) out.shift()
  return out
}

/** Tinggi kotak dalam satuan grid. Hari kosong berupa lempeng tipis; hari tersibuk ~7,6 sel. */
export const barHeight = (count: number, max: number, scale = 1): number =>
  count > 0 && max > 0 ? 0.4 + Math.pow(count / max, 0.85) * 7.2 * scale : 0.2

/** Porsi morph yang dipakai tiap batang untuk menunggu: gelombang dari minggu terlama ke terbaru. */
const WAVE = 0.42

/** 0 -> 1 saat batang naik selama morph. Semua datar di t=0 dan penuh di t=1. */
export const riseAt = (t: number, week: number, weeks: number, day: number): number => {
  const d = (weeks > 1 ? week / (weeks - 1) : 0) * 0.36 + (day / 6) * 0.06
  return easeOutCubic((t - d) / (1 - WAVE))
}

export const YAW_3D = Math.PI / 4
export const ELEV_3D = (34 * Math.PI) / 180
/** Di layar sempit (HP) grid dilihat lebih memanjang ke bawah agar batang 3D tampil lebih besar. */
export const NARROW_WIDTH = 640
export const YAW_3D_NARROW = (66 * Math.PI) / 180
export const YAW_RANGE: [number, number] = [(8 * Math.PI) / 180, (82 * Math.PI) / 180]
export const ELEV_RANGE: [number, number] = [(18 * Math.PI) / 180, (62 * Math.PI) / 180]

export type Cam = { cs: number; sn: number; se: number; ce: number }

/**
 * e=0 melihat lurus ke bawah (yaw 0, elevasi 90°): peta panas biasa. e=1 adalah sudut isometrik.
 * Geseran orbit hanya berlaku sebanding e, jadi tampilan datar tidak pernah miring.
 */
export const camera = (e: number, dYaw = 0, dElev = 0): Cam => {
  const yaw = Math.min(YAW_RANGE[1], Math.max(0, lerp(0, YAW_3D + dYaw, e)))
  const elev = lerp(
    Math.PI / 2,
    Math.min(ELEV_RANGE[1], Math.max(ELEV_RANGE[0], ELEV_3D + dElev)),
    e,
  )
  return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) }
}

/** Dunia (x = minggu, y = hari, z = atas) -> layar, sebelum skala/geser. */
export const project = (c: Cam, x: number, y: number, z: number): [number, number] => [
  x * c.cs - y * c.sn,
  (x * c.sn + y * c.cs) * c.se - z * c.ce,
]

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
export const luminance = (c: RGB): number => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

/** Empat warna level dari palet admin; level yang kosong memakai warna terakhir atau bawaan. */
export const resolvePalette = (p: Palette | undefined, dark: boolean): string[] => {
  const base = GITHUB_PALETTE[dark ? 'dark' : 'light']
  const pick = p ? (dark ? p.dark : p.light) : base
  return [0, 1, 2, 3].map((i) => pick[i] ?? pick[pick.length - 1] ?? base[i])
}
