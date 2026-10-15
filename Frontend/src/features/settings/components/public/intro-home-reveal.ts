// Transisi tombol Beranda di pemberitahuan pembuka (pilihan pemilik 2026-10-15, demo transisi set
// ketiga nomor 4 "Terhisap ke tombol"): cahaya vortex berputar dan terhisap masuk ke tombol Beranda
// bersama kartunya, tombol berpendar, lalu layar hitam memudar memperlihatkan Home.
// Tahap kedua (pendar dan layar hitam) dipasang langsung di <body>, bukan lewat React: saat bahasa
// ikut berganti, layout [locale] dipasang ulang dan komponen pemberitahuan ikut terlepas, tetapi
// layar hitam harus tetap menutup sampai halaman Home siap.

export type Point = { x: number; y: number }

// tempo sama dengan demo
export const SUCK_MS = 1150
const CARD_MS = 800
const CARD_DELAY_MS = 120
const RING_MS = 650
const VEIL_FADE_MS = 600
// paling lama menunggu halaman tujuan sebelum layar hitam memudar
const WAIT_MAX_MS = 1500
const EASE_IN = 'cubic-bezier(0.55, 0, 0.75, 0.2)'

// Tahap pertama, di dalam dialog: vortex dan kartu mengecil berputar menuju titik tombol.
export function suckIntoButton(dialog: HTMLDialogElement, origin: Point) {
  const canvas = dialog.querySelector('canvas')
  const card = dialog.querySelector<HTMLElement>('.intro-card')
  const animations: Animation[] = []
  if (canvas) {
    // kanvas memenuhi layar, jadi titik tombol di layar = titik asal transformasi
    const at = `${origin.x}px ${origin.y}px`
    animations.push(
      canvas.animate(
        [
          { transform: 'scale(1) rotate(0deg)', transformOrigin: at, opacity: 0.95 },
          {
            transform: 'scale(0.02) rotate(220deg)',
            transformOrigin: at,
            opacity: 1,
            offset: 0.92,
          },
          { transform: 'scale(0) rotate(240deg)', transformOrigin: at, opacity: 0 },
        ],
        { duration: SUCK_MS, easing: EASE_IN, fill: 'forwards' },
      ),
    )
  }
  if (card) {
    const box = card.getBoundingClientRect()
    const at = `${origin.x - box.left}px ${origin.y - box.top}px`
    animations.push(
      card.animate(
        [
          { transform: 'scale(1)', transformOrigin: at, opacity: 1 },
          { transform: 'scale(0)', transformOrigin: at, opacity: 0 },
        ],
        { duration: CARD_MS, delay: CARD_DELAY_MS, easing: EASE_IN, fill: 'both' },
      ),
    )
  }
  return Promise.all(animations.map((a) => a.finished)).then(
    () => undefined,
    () => undefined,
  )
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

// tunggu sampai alamat berganti ke halaman tujuan (navigasi klien selesai), lalu dua bingkai agar
// halaman baru sudah tergambar di balik layar hitam
async function waitForPath(path: string) {
  const start = performance.now()
  while (window.location.pathname !== path && performance.now() - start < WAIT_MAX_MS) {
    await nextFrame()
  }
  await nextFrame()
  await nextFrame()
}

// Tahap kedua: layar hitam dengan pendar di titik tombol menutup layar (langsung terlihat, tanpa
// celah), lalu memudar setelah halaman `path` tampil. Lapisan dilepas sendiri setelah selesai.
export function playHomeReveal(origin: Point, path: string) {
  const veil = document.createElement('div')
  veil.className = 'intro-veil'
  veil.setAttribute('aria-hidden', 'true')
  const ring = document.createElement('i')
  ring.style.left = `${origin.x}px`
  ring.style.top = `${origin.y}px`
  veil.append(ring)
  document.body.append(veil)

  const glow = ring.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(0.18)', opacity: 1, offset: 0.4 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
    ],
    { duration: RING_MS, easing: 'ease-out', fill: 'forwards' },
  )
  void waitForPath(path).then(() => {
    const fade = veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: VEIL_FADE_MS,
      easing: 'ease-out',
      fill: 'forwards',
    })
    void Promise.all([glow.finished, fade.finished])
      .catch(() => undefined)
      .finally(() => veil.remove())
  })
}
