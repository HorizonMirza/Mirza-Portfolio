// Hitungan murni untuk grafik SVG buatan sendiri (components/admin/visits-chart.tsx), pengganti
// recharts (audit 2026-11-17, PERF-04). Tanpa DOM supaya mudah dites.
export type XY = { x: number; y: number }

// Langkah "enak dibaca" bilangan bulat: 1, 2, 5, 10, 20, 25, 50, 100, ... (2,5 hanya dari 25)
function niceStep(min: number): number {
  for (let mag = 1; ; mag *= 10) {
    for (const f of [1, 2, 2.5, 5]) {
      const step = f * mag
      if (Number.isInteger(step) && step >= min) return step
    }
  }
}

// `count` tanda sumbu Y dari 0, kelipatan bilangan bulat, yang puncaknya menutupi `max`
export function niceTicks(max: number, count = 5): number[] {
  const intervals = Math.max(1, count - 1)
  const step = niceStep(Math.max(1, max / intervals))
  return Array.from({ length: intervals + 1 }, (_, i) => i * step)
}

// indeks label sumbu X: selalu titik pertama dan terakhir, sisanya merata dengan jarak minimal
// `minGap` piksel antarlabel (seperti interval="preserveStartEnd" di recharts)
export function pickTickIndexes(count: number, width: number, minGap: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [0]
  const maxLabels = Math.max(2, Math.floor(width / minGap))
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i)
  const step = Math.ceil((count - 1) / (maxLabels - 1))
  const picked: number[] = []
  for (let i = 0; i < count - 1; i += step) picked.push(i)
  // label terakhir tidak boleh menempel pada label sebelumnya
  if (picked.length > 1 && count - 1 - picked[picked.length - 1] < step * 0.8) picked.pop()
  picked.push(count - 1)
  return picked
}

// Kurva kubik monoton (Fritsch-Carlson), sama sifatnya dengan type="monotone" di recharts: tidak
// pernah melampaui nilai data di antara dua titik, jadi tidak ada lembah palsu di bawah nol.
export function monotonePath(points: XY[]): string {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M${points[0].x},${points[0].y}`
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x)
    slope.push(dx[i] === 0 ? 0 : (points[i + 1].y - points[i].y) / dx[i])
  }
  const m: number[] = new Array(n).fill(0)
  m[0] = slope[0]
  m[n - 1] = slope[n - 2]
  for (let i = 1; i < n - 1; i++)
    m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / slope[i]
    const b = m[i + 1] / slope[i]
    const sum = a * a + b * b
    if (sum > 9) {
      const tau = 3 / Math.sqrt(sum)
      m[i] = tau * a * slope[i]
      m[i + 1] = tau * b * slope[i]
    }
  }
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += `C${points[i].x + h},${points[i].y + m[i] * h},${points[i + 1].x - h},${points[i + 1].y - m[i + 1] * h},${points[i + 1].x},${points[i + 1].y}`
  }
  return d
}

// garis kurva yang ditutup ke sumbu bawah untuk arsiran
export function areaPath(points: XY[], baseY: number): string {
  if (points.length < 2) return ''
  const last = points[points.length - 1]
  return `${monotonePath(points)}L${last.x},${baseY}L${points[0].x},${baseY}Z`
}

// potong deret yang bisa kosong (null) menjadi ruas berurutan; ruas 1 titik tidak digambar
export function segments<T>(values: (T | null)[]): { start: number; items: T[] }[] {
  const out: { start: number; items: T[] }[] = []
  let current: { start: number; items: T[] } | null = null
  values.forEach((v, i) => {
    if (v === null) {
      current = null
      return
    }
    if (!current) {
      current = { start: i, items: [] }
      out.push(current)
    }
    current.items.push(v)
  })
  return out
}
