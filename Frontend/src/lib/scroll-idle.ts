// Penanda "halaman sedang digulir" bersama untuk animasi kanvas (vortex hero, globe skill): selama
// digulir dan sampai IDLE_MS sesudahnya, animasi dekoratif melewatkan bingkai agar gulir tetap mulus
// (laporan lag pemilik 2026-10-20). Satu pendengar scroll pasif untuk seluruh halaman.
const IDLE_MS = 160

let scrolling = false
let timer = 0
let listening = false
const waiting = new Set<() => void>()

function onScroll() {
  scrolling = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    scrolling = false
    for (const resume of waiting) resume()
    waiting.clear()
  }, IDLE_MS)
}

function listen() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('scroll', onScroll, { passive: true })
}

// true selama halaman digulir; memasang pendengar pada pemanggilan pertama
export function isScrolling() {
  listen()
  return scrolling
}

// jalankan `resume` sekali setelah gulir berhenti (mis. memulai lagi loop animasi). Mengembalikan
// fungsi pembatal: komponen yang dibongkar saat halaman masih digulir wajib memanggilnya, agar
// loop animasinya tidak hidup lagi setelah komponen hilang (audit 2026-10-31, BUG-01/02).
export function onScrollEnd(resume: () => void): () => void {
  listen()
  if (!scrolling) {
    resume()
    return () => {}
  }
  waiting.add(resume)
  return () => waiting.delete(resume)
}
