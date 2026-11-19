// Geometri globe skill: titik merata di bola, rotasi, proyeksi, sudut menghadap, dan gaya awal
// tiap logo. Murni, dipakai mesin animasi (engine.ts) dan render server (index.tsx).

// garis bola: ruas per lingkaran dan jumlah tingkat kedalaman untuk pengelompokan stroke
export const RING_STEPS = 60
export const DEPTH_BANDS = 6

export type Vec = [number, number, number]

// sudut awal: sedikit miring agar kesan bola langsung terlihat
export const START_YAW = 0.4
export const START_PITCH = -0.25
// putaran otomatis per frame (radian) dan batas miring saat digeser
// jeda antarbingkai saat berputar otomatis (±30 fps)
export const AUTO_FRAME_MS = 30
export const AUTO_SPEED = 0.0028
export const PITCH_LIMIT = 1.2
const FACE_PITCH = 0.75
// scroll lebih jauh dari ini (px) melepas logo terpilih
export const SCROLL_RELEASE = 48
// geseran di bawah ini masih dianggap tekan, bukan memutar
export const DRAG_THRESHOLD = 4
// nama skill hanya tampil di sisi depan (kedalaman 0 belakang .. 1 depan)
const LABEL_DEPTH = 0.6
// logo di sisi belakang, atau yang tertutup logo lain di depannya, terlalu kecil untuk ditekan
// (WCAG 2.5.8), jadi inert sampai berputar ke posisi yang lega. Panah kiri/kanan tetap menjangkau semua logo (diputar ke depan dulu) dan
// daftar lengkap skill tersedia untuk pembaca layar.
const BACK_DEPTH = 0.45
// ukuran target minimum WCAG 2.5.8 (px)
export const MIN_TARGET = 24

export type Rect = [left: number, top: number, right: number, bottom: number]
export const overlaps = (a: Rect, b: Rect) =>
  a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]

// titik merata di permukaan bola (spiral Fibonacci), digeser setengah langkah agar tidak ada logo
// tepat di kutub (bola akan terlihat dari atas saat logo itu diputar ke depan)
export function spherePoints(n: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]
  })
}

function rotate([x, y, z]: Vec, yaw: number, pitch: number): Vec {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp]
}

// hasil rotasi diproyeksikan dengan perspektif ringan; x dan y dalam satuan jari-jari bola
export function project(p: Vec, yaw: number, pitch: number, scale = 1): Vec {
  const [x, y, z] = rotate(p, yaw, pitch)
  const persp = 1 / (1 - z * 0.28)
  return [x * scale * persp, y * scale * persp, z]
}

// sudut yang membuat titik p menghadap pengunjung; kemiringan dibatasi agar tetap tampak seperti bola
export function facing([x, y, z]: Vec): [number, number] {
  const pitch = Math.atan2(y, Math.hypot(x, z))
  return [Math.atan2(-x, z), Math.max(-FACE_PITCH, Math.min(FACE_PITCH, pitch))]
}

// variabel CSS satu logo: posisi, skala, keburaman, dan tampil tidaknya nama
// makin banyak skill makin kecil logonya, agar bola tetap lega (penuh sampai 24 skill)
export function densityScale(count: number) {
  return Math.min(1, Math.sqrt(24 / Math.max(1, count)))
}

export function itemStyle(p: Vec, yaw: number, pitch: number, density: number) {
  const [x, y, z] = project(p, yaw, pitch)
  const depth = (z + 1) / 2
  return {
    '--x': x.toFixed(4),
    '--y': y.toFixed(4),
    '--s': (density * (0.5 + depth * 0.55)).toFixed(3),
    '--o': (0.18 + depth * 0.82).toFixed(3),
    '--lo': depth >= LABEL_DEPTH ? '1' : '0',
    back: depth < BACK_DEPTH,
    zIndex: Math.round(depth * 100),
  }
}

// selisih sudut terpendek dari `from` ke `to` (radian, -π..π)
export const shortest = (from: number, to: number) => {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}
