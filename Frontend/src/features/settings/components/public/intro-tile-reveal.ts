// Transisi tombol Beranda di pemberitahuan pembuka (pilihan pemilik 2026-10-15, demo transisi 9
// "Kotak-kotak", diperlambat): layar hitam dipecah menjadi kotak yang menghilang satu per satu,
// menyebar dari tombol Beranda, membuka halaman Home di baliknya.
// Lapisan kotak dipasang langsung di <body>, bukan lewat React: saat bahasa ikut berganti, layout
// [locale] dipasang ulang dan komponen pemberitahuan ikut terlepas, tetapi kotak harus tetap menutup
// layar sampai halaman Home siap.

// tempo (diperlambat atas permintaan pemilik)
export const TILE_MS = 700
export const TILE_SPREAD_MS = 1100
// paling lama menunggu halaman tujuan sebelum kotak mulai terbuka
const WAIT_MAX_MS = 1500

export type Point = { x: number; y: number }

// Jeda tiap kotak sebanding jaraknya dari titik asal: kotak terdekat hilang lebih dulu.
export function tileDelays(cols: number, rows: number, size: number, origin: Point) {
  const reach = Math.hypot(
    Math.max(origin.x, cols * size - origin.x),
    Math.max(origin.y, rows * size - origin.y),
  )
  const delays: number[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.hypot((col + 0.5) * size - origin.x, (row + 0.5) * size - origin.y)
      delays.push(Math.round((reach ? distance / reach : 0) * TILE_SPREAD_MS))
    }
  }
  return delays
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

// tunggu sampai alamat berganti ke halaman tujuan (navigasi klien selesai), lalu dua bingkai agar
// halaman baru sudah tergambar di balik kotak
async function waitForPath(path: string) {
  const start = performance.now()
  while (window.location.pathname !== path && performance.now() - start < WAIT_MAX_MS) {
    await nextFrame()
  }
  await nextFrame()
  await nextFrame()
}

// Memasang kotak hitam yang menutup layar (langsung terlihat, tanpa celah), lalu membukanya setelah
// halaman `path` tampil. Lapisan dilepas sendiri setelah selesai.
export function playTileReveal(origin: Point, path: string) {
  const width = window.innerWidth
  const height = window.innerHeight
  const size = width < 600 ? 40 : 64
  const cols = Math.ceil(width / size)
  const rows = Math.ceil(height / size)

  const layer = document.createElement('div')
  layer.className = 'intro-tiles'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`
  layer.style.gridAutoRows = `${size}px`
  const tiles = Array.from({ length: cols * rows }, () => document.createElement('i'))
  layer.append(...tiles)
  document.body.append(layer)

  void waitForPath(path).then(() => {
    const delays = tileDelays(cols, rows, size, origin)
    const animations = tiles.map((tile, index) =>
      tile.animate(
        [
          { transform: 'scale(1)', opacity: 1, backgroundColor: '#000' },
          { backgroundColor: '#2b2470', offset: 0.35 },
          { transform: 'scale(0)', opacity: 0, backgroundColor: '#4b40c8' },
        ],
        { duration: TILE_MS, delay: delays[index], easing: 'ease-in', fill: 'both' },
      ),
    )
    void Promise.all(animations.map((a) => a.finished))
      .catch(() => undefined)
      .finally(() => layer.remove())
  })
}
