// Fisika kartu ID tanpa library: titik verlet untuk tali dan kartu, sambungan berpanjang tetap,
// dan dinding yang memantulkan. Ukuran dalam px tata letak.

export const CARD_W = 200
export const CARD_H = 300
export const ROPE_LEN = 200
export const ROPE_POINTS = 14
export const ROPE_W = 16
export const PHOTO_H = 160
const GRAVITY = 2100
const DAMPING = 0.992
export const BOUNCE = 0.55

// Area tarik kartu: lebar awal kanvas sebelum JavaScript, lalu sampai SIDE_MAX px ke kiri dan kanan
// dari tengah kolom (dibatasi tepi layar agar halaman tidak bisa digeser menyamping) dan ke bawah
// sampai garis atas footer, tanpa mengubah tata letak halaman.
export const CANVAS_W = 560
export const SIDE_MAX = 520
// cadangan tinggi tambahan bila footer tidak ditemukan
export const EXTRA_BOTTOM = 220
export const SCREEN_GAP = 8
// jarak sudut terbawah kartu dari garis footer
export const FLOOR_GAP = 4
// Jarak titik kartu dari tepi kanvas: setengah lebar kartu + ruang bayangan, agar sudut kartu dan
// bayangannya tidak terpotong tepi kanvas.
export const CARD_EDGE = CARD_W / 2 + 28
// Tinggi kotak dalam px, bukan rem: fisika memakai px, sedangkan rem menyusut di desktop (87,5%).
// Bila kotak lebih pendek dari tali + kartu + jarak tepi, kartu menyentuh lantai dan diam miring.
export const BOX_H = ROPE_LEN + CARD_H + CARD_EDGE + 12

/** Titik verlet: posisi sekarang, posisi sebelumnya, dan kebalikan massa (0 = tetap di tempat). */
export type Point = { x: number; y: number; px: number; py: number; inv: number }

export const point = (x: number, y: number, inv: number): Point => ({ x, y, px: x, py: y, inv })

/** Satu langkah verlet: kecepatan dari selisih posisi, diredam, ditambah gravitasi. */
export function integrate(p: Point, dt: number) {
  if (p.inv === 0) return
  const vx = (p.x - p.px) * DAMPING
  const vy = (p.y - p.py) * DAMPING
  p.px = p.x
  p.py = p.y
  p.x += vx
  p.y += vy + GRAVITY * dt * dt
}

/** Jaga jarak dua titik tetap `len`, dibagi menurut massanya. */
export function link(a: Point, b: Point, len: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy) || 0.0001
  const diff = (d - len) / d
  const total = a.inv + b.inv || 1
  a.x += dx * diff * (a.inv / total)
  a.y += dy * diff * (a.inv / total)
  b.x -= dx * diff * (b.inv / total)
  b.y -= dy * diff * (b.inv / total)
}

/** Pantulkan titik dari tepi kanvas. m: jarak dari tepi kiri, kanan, dan atas; floor: dari bawah. */
export function walls(p: Point, width: number, height: number, m = 6, floor = m) {
  if (p.inv === 0) return
  if (p.x < m) {
    const v = p.x - p.px
    p.x = m
    p.px = m + v * BOUNCE
  }
  if (p.x > width - m) {
    const v = p.x - p.px
    p.x = width - m
    p.px = width - m + v * BOUNCE
  }
  // tepi atas juga dinding: kartu yang dilempar ke atas memantul turun
  if (p.y < m) {
    const v = p.y - p.py
    p.y = m
    p.py = m + v * BOUNCE
  }
  if (p.y > height - floor) {
    const v = p.y - p.py
    p.y = height - floor
    p.py = height - floor + v * BOUNCE
  }
}

/**
 * Sudut terbawah kartu (garis top-bot), pada sudut putar berapa pun, tidak boleh melewati
 * `height - FLOOR_GAP`. Bila lewat, kartu diangkat utuh dan kecepatan turunnya dipantulkan.
 */
export function cardFloor(top: Point, bot: Point, height: number) {
  const dx = bot.x - top.x
  const dy = bot.y - top.y
  const len = Math.hypot(dx, dy) || 1
  const halfW = Math.abs((dx / len) * (CARD_W / 2))
  const lowest = Math.max(top.y, bot.y) + halfW
  const limit = height - FLOOR_GAP
  if (lowest <= limit) return
  const d = lowest - limit
  for (const p of [top, bot]) {
    const v = p.y - p.py
    p.y -= d
    p.py = v > 0 ? p.y + v * BOUNCE : p.y - v
  }
}
